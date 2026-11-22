const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const pool = require("./db");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./auth");
const authenticateToken = require("./middleware");
const createSmtpTransport = require("./mailer");
const { getUserSettings } = require("./settings-store");
const app = express();

const server = http.createServer(app);

const socketCorsOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "https://itsimplere-fullstack-1.onrender.com",
    process.env.CLIENT_URL,
    process.env.APP_BASE_URL
].filter(Boolean).map(origin => new URL(origin).origin);

const io = new Server(server, {
    cors: {
        origin: [...new Set(socketCorsOrigins)],
        methods: ["GET", "POST"]
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication required"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return next(new Error("Invalid or expired token"));
        }

        socket.user = user;
        next();
    });
});

const PORT = Number(process.env.PORT || 5000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error("PORT must be a valid TCP port.");
}

async function getDocumentRole(documentId, userId) {

    const result = await pool.query(
        `SELECT
            CASE
                WHEN owner_id = $2 THEN 'Owner'
                ELSE (
                    SELECT role
                    FROM document_permissions
                    WHERE document_id = $1
                    AND user_id = $2
                )
            END AS role
        FROM documents
        WHERE id = $1`,
        [documentId, userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0].role;
}

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

// GET: Retrieve all documents owned by or shared with the user
app.get("/api/documents", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT documents.*,
                CASE
                    WHEN documents.owner_id = $1 THEN 'Owner'
                    ELSE document_permissions.role
                END AS user_role
             FROM documents
             LEFT JOIN document_permissions
             ON documents.id = document_permissions.document_id
             WHERE documents.owner_id = $1
             OR document_permissions.user_id = $1
             ORDER BY documents.created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Error retrieving documents"
        });
    }
});

// GET: Retrieve one document by ID
app.get("/api/documents/:id", authenticateToken, async (req, res) => {
    try {
       const documentId = req.params.id;

// First, check whether the document exists
const documentExists = await pool.query(
    "SELECT id FROM documents WHERE id = $1",
    [documentId]
);

if (documentExists.rows.length === 0) {
    return res.status(404).json({
        message: "Document not found"
    });
}

// Then, check the user's permission
const role = await getDocumentRole(
    documentId,
    req.user.id
);

        if (!role) {
            return res.status(403).json({
                message: "You do not have permission to access this document"
            });
        }

        const result = await pool.query(
            `SELECT *,
                $2 AS user_role
            FROM documents
            WHERE id = $1`,
            [documentId, role]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Error retrieving document"
        });
    }
});

// POST: Share a document with another user
app.post("/api/documents/:id/share", authenticateToken, async (req, res) => {
    try {
        const documentId = Number(req.params.id);
        const { email, role } = req.body;

        const ownerRole = await getDocumentRole(
            documentId,
            req.user.id
        );

        if (ownerRole !== "Owner") {
            return res.status(403).json({
                message: "Only the document Owner can share it"
            });
        }

        if (!["Editor", "Viewer"].includes(role)) {
            return res.status(400).json({
                message: "Role must be Editor or Viewer"
            });
        }

        const userResult = await pool.query(
            "SELECT id, email FROM users WHERE email = $1",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const sharedUserId = userResult.rows[0].id;

        if (sharedUserId === req.user.id) {
            return res.status(400).json({
                message: "You cannot share a document with yourself"
            });
        }

        const recipientSettings = await getUserSettings(sharedUserId);
        await pool.query(
            `INSERT INTO document_permissions
             (document_id, user_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (document_id, user_id)
             DO UPDATE SET role = EXCLUDED.role`,
            [documentId, sharedUserId, role]
        );

        let notificationWarning;
        if (recipientSettings.notify_on_share) {
            try {
                const transport = createSmtpTransport();
                if (!transport) {
                    notificationWarning = "Email notifications are enabled, but SMTP is not configured.";
                } else {
                    const documentResult = await pool.query(
                        "SELECT title FROM documents WHERE id = $1",
                        [documentId]
                    );
                    await transport.sendMail({
                        from: process.env.SMTP_FROM,
                        to: userResult.rows[0].email,
                        subject: "A CodeSync document was shared with you",
                        text: `${req.user.email} shared "${documentResult.rows[0].title}" with you as a ${role}. Sign in to CodeSync to open it.`
                    });
                }
            } catch (error) {
                console.error("Document share email notification failed:", error.message);
                notificationWarning = "The document was shared, but the email notification could not be sent.";
            }
        }

        res.status(201).json({
            message: "Document shared successfully",
            documentId,
            sharedWith: email,
            role,
            ...(notificationWarning ? { notificationWarning } : {})
        });

    } catch (error) {
        console.error("Sharing error:", error.message);

        res.status(500).json({
            message: "Error sharing document"
        });
    }
});

// POST: Create a new document
app.post("/api/documents", authenticateToken, async (req, res) => {
    try {
        const { title, type, content } = req.body;

        const result = await pool.query(
            `INSERT INTO documents
            (title, type, content, language, owner_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                title,
                type,
                content || "",
                req.body.language || "javascript",
                req.user.id
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Error creating document"
        });
    }
});

app.post("/api/documents/:id/versions/:versionId/restore", authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const versionId = Number(req.params.versionId);

        const role = await getDocumentRole(id, req.user.id);

        if (!role) {
            return res.status(403).json({
                message: "You do not have permission to restore this document"
            });
        }

        if (role !== "Owner" && role !== "Editor") {
            return res.status(403).json({
                message: "Only Owners and Editors can restore versions"
            });
        }

        const versionResult = await pool.query(
            `SELECT *
             FROM document_versions
             WHERE id = $1 AND document_id = $2`,
            [versionId, id]
        );

        if (versionResult.rows.length === 0) {
            return res.status(404).json({
                message: "Version not found"
            });
        }

        const oldVersion = versionResult.rows[0];

        const updateResult = await pool.query(
            `UPDATE documents
             SET content = $1, language = $2
             WHERE id = $3
             RETURNING *`,
            [oldVersion.content, oldVersion.language, id]
        );

        const numberResult = await pool.query(
            `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
             FROM document_versions
             WHERE document_id = $1`,
            [id]
        );

        const nextVersion = numberResult.rows[0].next_version;

        await pool.query(
            `INSERT INTO document_versions
             (document_id, content, language, version_number, created_by)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                id,
                oldVersion.content,
                oldVersion.language,
                nextVersion,
                req.user.id
            ]
        );

        res.json({
            message: "Version restored successfully",
            document: updateResult.rows[0],
            newVersionNumber: nextVersion
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Error restoring document version"
        });
    }
});

// DELETE: Remove a document
app.delete("/api/documents/:id", authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);

        const role = await getDocumentRole(id, req.user.id);

        if (!role) {
            return res.status(403).json({
                message: "You do not have permission to delete this document"
            });
        }

        if (role !== "Owner") {
            return res.status(403).json({
                message: "Only the document Owner can delete it"
            });
        }

        const result = await pool.query(
            "DELETE FROM documents WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        res.json({
            message: "Document deleted successfully",
            document: result.rows[0]
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Error deleting document"
        });
    }
});

// PUT: Update a document
app.put("/api/documents/:id", authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { title, type, content } = req.body;

        const role = await getDocumentRole(id, req.user.id);

        if (!role) {
            return res.status(403).json({
                message: "You do not have permission to update this document"
            });
        }

        if (role !== "Owner" && role !== "Editor") {
            return res.status(403).json({
                message: "Only Owners and Editors can update documents"
            });
        }

        const result = await pool.query(
            `UPDATE documents
             SET title = $1, type = $2, content = $3, language = $4
             WHERE id = $5
             RETURNING *`,
            [
                title,
                type,
                content,
                req.body.language || "javascript",
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        const versionResult = await pool.query(
            `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
            FROM document_versions
            WHERE document_id = $1`,
            [id]
        );

        const nextVersion = versionResult.rows[0].next_version;

        await pool.query(
            `INSERT INTO document_versions
            (document_id, content, language, version_number, created_by)
            VALUES ($1, $2, $3, $4, $5)`,
        [
            id,
            result.rows[0].content,
            result.rows[0].language,
            nextVersion,
            req.user.id
        ]
    );

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Error updating document"
        });
    }
});

//version history
app.get("/api/documents/:id/versions", authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);

        const role = await getDocumentRole(id, req.user.id);

        if (!role) {
            return res.status(403).json({
                message: "You do not have permission to view this document"
            });
        }

        const result = await pool.query(
            `SELECT *
             FROM document_versions
             WHERE document_id = $1
             ORDER BY version_number DESC`,
            [id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Error retrieving document versions"
        });
    }
});

    io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Allow users to join documents they have permission to access
socket.on("join-document", async (documentId) => {
    try {
        const id = Number(documentId);

        if (!Number.isInteger(id) || id <= 0) {
            return;
        }

        const role = await getDocumentRole(id, socket.user.id);

        if (!role) {
            console.log("User does not have permission to join:", id);
            return;
        }

        socket.join(String(id));

        socket.data.documentRoles =
            socket.data.documentRoles || {};

        socket.data.documentRoles[id] = role;

        console.log(
            `User ${socket.user.id} joined document ${id} as ${role}`
        );

    } catch (error) {
        console.error("Error joining document:", error.message);
    }
});

    socket.on("leave-document", (documentId) => {
    const id = Number(documentId);

    if (!Number.isInteger(id) || id <= 0) {
        return;
    }

    socket.leave(String(id));

    if (socket.data.documentRoles) {
        delete socket.data.documentRoles[id];
    }

    console.log(
        `User ${socket.user.id} left document ${id}`
    );
});

        // Receive document changes and broadcast them
    socket.on("document-change", async (data) => {
        console.log("Received document change:", data);

        try {
        const documentId = Number(data.documentId);

        if (!socket.rooms.has(String(documentId))) {
            console.log("User has not joined this document room");
                return;
            }

        const role = await getDocumentRole(documentId, socket.user.id);

        if (role !== "Owner" && role !== "Editor") {
            console.log("User is not allowed to edit this document");
                return;
            }

        if (!Number.isInteger(documentId) || typeof data.content !== "string") {
            return;
        }

        // Save the latest content in PostgreSQL
       const result = await pool.query(
            "UPDATE documents SET content = $1 WHERE id = $2 RETURNING id, content",
            [data.content, documentId]
        );

        console.log("Database saved:", result.rows[0]);

        // Broadcast the change to other users
        socket.to(String(documentId)).emit(
            "receive-change",
            data.content
        );

    } catch (error) {
        console.error("Error saving document content:", error.message);
    }
});

    socket.on("disconnect", () => {
    socket.data.documentRoles = {};

    console.log(
        `User ${socket.user.id} disconnected:`,
        socket.id
    );
});
});

// Start the server
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});


