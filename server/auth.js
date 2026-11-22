const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("./db");
const router = express.Router();
const authenticateToken = require("./middleware");
const createSmtpTransport = require("./mailer");
const { ensureSettingsTable, getUserSettings } = require("./settings-store");

let passwordResetTablePromise;

function ensurePasswordResetTable() {
    if (!passwordResetTablePromise) {
        passwordResetTablePromise = pool.query(
            `CREATE TABLE IF NOT EXISTS password_reset_tokens (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash CHAR(64) PRIMARY KEY,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`
        ).catch((error) => {
            passwordResetTablePromise = null;
            throw error;
        });
    }

    return passwordResetTablePromise;
}

function hashResetToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

//register
router.post("/register", async (req, res) => {

    try {

        const { username, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (username, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, username, email`,
            [username, email, hashedPassword]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {

        console.error("Registration error:", error);

        res.status(500).json({
            message: "Registration failed"
        });

    }

});

//login
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed"
        });

    }

});

router.post("/forgot-password", async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
    if (!email || email.length > 254) {
        return res.status(400).json({ message: "Enter a valid email address." });
    }

    let transport;
    try {
        transport = createSmtpTransport();
    } catch (error) {
        console.error("Password reset mail configuration error:", error.message);
        return res.status(503).json({
            message: "Password reset email is not available right now. Please try again later."
        });
    }

    if (!transport) {
        return res.status(503).json({
            message: "Password reset email is not configured. Please contact the administrator."
        });
    }

    let resetUrl;
    try {
        resetUrl = new URL("/", process.env.APP_BASE_URL || "http://localhost:5173");
        if (!["http:", "https:"].includes(resetUrl.protocol)) {
            throw new Error("APP_BASE_URL must use HTTP or HTTPS");
        }
    } catch (error) {
        console.error("Password reset URL configuration error:", error.message);
        return res.status(503).json({
            message: "Password reset email is not available right now. Please try again later."
        });
    }

    try {
        await ensurePasswordResetTable();

        const result = await pool.query(
            "SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(202).json({
                message: "If an account exists for that email, a reset link is on its way."
            });
        }

        const user = result.rows[0];
        const token = crypto.randomBytes(32).toString("base64url");
        const tokenHash = hashResetToken(token);
        const client = await pool.connect();

        try {
            await client.query("BEGIN");
            await client.query(
                "DELETE FROM password_reset_tokens WHERE user_id = $1",
                [user.id]
            );
            await client.query(
                `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
                 VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
                [user.id, tokenHash]
            );
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }

        resetUrl.searchParams.set("resetToken", token);

        try {
            await transport.sendMail({
                from: process.env.SMTP_FROM,
                to: user.email,
                subject: "Reset your CodeSync password",
                text: `Use this link to reset your CodeSync password. The link expires in 30 minutes:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`
            });
        } catch (error) {
            console.error("Password reset email delivery failed:", error.message);
            try {
                await pool.query(
                    "DELETE FROM password_reset_tokens WHERE token_hash = $1",
                    [tokenHash]
                );
            } catch (cleanupError) {
                console.error("Could not remove undelivered password reset token:", cleanupError.message);
            }
            return res.status(503).json({
                message: "Password reset email is temporarily unavailable. Please try again later."
            });
        }

        return res.status(202).json({
            message: "If an account exists for that email, a reset link is on its way."
        });
    } catch (error) {
        console.error("Password reset request error:", error);
        return res.status(500).json({
            message: "Could not process the password reset request."
        });
    }
});

router.post("/reset-password", async (req, res) => {
    const { token, password } = req.body;
    if (
        typeof token !== "string" ||
        typeof password !== "string" ||
        password.length < 8 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        return res.status(400).json({
            message: "Use a reset link and choose a password between 8 and 72 bytes."
        });
    }

    try {
        await ensurePasswordResetTable();
        const tokenHash = hashResetToken(token);
        const hashedPassword = await bcrypt.hash(password, 10);
        const client = await pool.connect();

        try {
            await client.query("BEGIN");
            const result = await client.query(
                `SELECT user_id
                 FROM password_reset_tokens
                 WHERE token_hash = $1 AND expires_at > NOW()
                 FOR UPDATE`,
                [tokenHash]
            );

            if (result.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message: "This reset link is invalid or has expired. Request a new one."
                });
            }

            const userId = result.rows[0].user_id;
            await client.query(
                "UPDATE users SET password = $1 WHERE id = $2",
                [hashedPassword, userId]
            );
            await client.query(
                "DELETE FROM password_reset_tokens WHERE user_id = $1",
                [userId]
            );
            await client.query("COMMIT");

            return res.json({ message: "Password updated. You can now sign in." });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Password reset error:", error);
        return res.status(500).json({
            message: "Could not reset the password. Please try again."
        });
    }
});

//protected profile
router.get("/profile", authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT id, username, email FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            user: result.rows[0]
        });

    } catch (error) {

        console.error("Profile error:", error);

        res.status(500).json({
            message: "Could not retrieve profile"
        });

    }

});

router.put("/profile", authenticateToken, async (req, res) => {
    const username = typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    if (!username || username.length > 50) {
        return res.status(400).json({
            message: "Display name must be between 1 and 50 characters."
        });
    }

    try {
        const result = await pool.query(
            `UPDATE users
             SET username = $1
             WHERE id = $2
             RETURNING id, username, email`,
            [username, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.json({ user: result.rows[0] });
    } catch (error) {
        console.error("Profile update error:", error);
        return res.status(500).json({
            message: "Could not update your profile."
        });
    }
});

router.get("/settings", authenticateToken, async (req, res) => {
    try {
        const settings = await getUserSettings(req.user.id);
        return res.json({ settings });
    } catch (error) {
        console.error("Settings retrieval error:", error);
        return res.status(500).json({
            message: "Could not retrieve your settings."
        });
    }
});

router.put("/settings", authenticateToken, async (req, res) => {
    const {
        default_language: defaultLanguage,
        autosave_delay_ms: autosaveDelayMs,
        theme,
        notify_on_share: notifyOnShare
    } = req.body;

    if (
        !["javascript", "python", "java", "cpp", "html"].includes(defaultLanguage) ||
        ![500, 1000, 2000].includes(autosaveDelayMs) ||
        !["dark", "light"].includes(theme) ||
        typeof notifyOnShare !== "boolean"
    ) {
        return res.status(400).json({ message: "Invalid settings values." });
    }

    try {
        await ensureSettingsTable();
        const result = await pool.query(
            `INSERT INTO user_settings
                (user_id, default_language, autosave_delay_ms, theme, notify_on_share)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id)
             DO UPDATE SET
                default_language = EXCLUDED.default_language,
                autosave_delay_ms = EXCLUDED.autosave_delay_ms,
                theme = EXCLUDED.theme,
                notify_on_share = EXCLUDED.notify_on_share
             RETURNING default_language, autosave_delay_ms, theme, notify_on_share`,
            [req.user.id, defaultLanguage, autosaveDelayMs, theme, notifyOnShare]
        );

        return res.json({ settings: result.rows[0] });
    } catch (error) {
        console.error("Settings update error:", error);
        return res.status(500).json({
            message: "Could not save your settings."
        });
    }
});

router.post("/change-password", authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string" ||
        newPassword.length < 8 ||
        Buffer.byteLength(newPassword, "utf8") > 72
    ) {
        return res.status(400).json({
            message: "Choose a new password between 8 and 72 bytes."
        });
    }

    try {
        const result = await pool.query(
            "SELECT password FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!await bcrypt.compare(currentPassword, result.rows[0].password)) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await pool.query(
            "UPDATE users SET password = $1 WHERE id = $2",
            [passwordHash, req.user.id]
        );

        return res.json({ message: "Password changed successfully." });
    } catch (error) {
        console.error("Password change error:", error);
        return res.status(500).json({
            message: "Could not change your password."
        });
    }
});

router.delete("/account", authenticateToken, async (req, res) => {
    const { currentPassword, confirmation } = req.body;
    if (typeof currentPassword !== "string" || confirmation !== "DELETE") {
        return res.status(400).json({
            message: 'Enter your current password and type "DELETE" to confirm.'
        });
    }

    let client;
    let transactionStarted = false;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        transactionStarted = true;

        const result = await client.query(
            "SELECT password FROM users WHERE id = $1 FOR UPDATE",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return res.status(404).json({ message: "User not found." });
        }

        if (!await bcrypt.compare(currentPassword, result.rows[0].password)) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        const ownedDocuments = await client.query(
            "SELECT COUNT(*)::integer AS count FROM documents WHERE owner_id = $1",
            [req.user.id]
        );

        if (ownedDocuments.rows[0].count > 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return res.status(409).json({
                message: "Delete all documents you own before deleting your account.",
                ownedDocumentCount: ownedDocuments.rows[0].count
            });
        }

        await client.query(
            "UPDATE document_versions SET created_by = NULL WHERE created_by = $1",
            [req.user.id]
        );
        await client.query(
            "DELETE FROM document_permissions WHERE user_id = $1",
            [req.user.id]
        );
        await client.query("DELETE FROM users WHERE id = $1", [req.user.id]);
        await client.query("COMMIT");
        transactionStarted = false;

        return res.json({ message: "Your account has been deleted." });
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }
        console.error("Account deletion error:", error);
        return res.status(500).json({
            message: "Could not delete your account."
        });
    } finally {
        if (client) {
            client.release();
        }
    }
});

module.exports = router;