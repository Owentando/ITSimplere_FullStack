
import { useState, useEffect, useRef } from "react";
import DocumentCard from "../components/DocumentCard";
import Sidebar from "../components/Sidebar";
import socket from "../socket";
import CodeEditor from "../components/CodeEditor";
import Whiteboard from "../components/Whiteboard";
import Login from "../components/Login";
import ShareDocument from "../components/ShareDocument";

function Dashboard() {

    const [documents, setDocuments] = useState([]);
    const [newDocument, setNewDocument] = useState("");
    const [documentType, setDocumentType] = useState("Code Editor");
    const [versions, setVersions] = useState([]);
    const [content, setContent] = useState("");
    const [language, setLanguage] = useState("javascript");
    const saveTimer = useRef(null);
    const [editingId, setEditingId] = useState(null);
    const [user, setUser] = useState(null);
    const [documentRole, setDocumentRole] = useState(null);

    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected to Socket.IO:", socket.id);
        });

        socket.on("receive-change", (updatedContent) => {
            setContent(updatedContent);
        });

        return () => {
            socket.off("connect");
            socket.off("receive-change");
        };
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) return;

        fetch("https://itsimplere-fullstack.onrender.com/api/auth/profile", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Session expired");
                }

                return response.json();
            })
            .then(data => {
                setUser(data.user || data);
            })
            .catch(error => {
                console.error("Session error:", error);
                localStorage.removeItem("token");
                setUser(null);
            });
    }, []);

    // Retrieve documents from the backend
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("No login token found.");
            setDocuments([]);
            return;
        }

        fetch("https://itsimplere-fullstack.onrender.com/api/documents", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Could not retrieve documents");
                }

                return response.json();
            })
            .then(data => {
                setDocuments(data);
            })
            .catch(error => {
                console.error("Error loading documents:", error);
                setDocuments([]);
            });
    }, [user]);

    // createDocument function (POST)
    async function createDocument() {
        if (newDocument.trim() === "") {
            return;
        }

        const token = localStorage.getItem("token");

        // If a document is being edited
        if (editingId !== null) {
            const response = await fetch(
                `https://itsimplere-fullstack.onrender.com/api/documents/${editingId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: newDocument,
                        type: documentType,
                        content: content,
                        language: language
                    })
                }
            );

            if (!response.ok) {
                console.error("Could not update document");
                return;
            }

            const updatedDocument = await response.json();

            const updatedDocuments = documents.map(document =>
                document.id === editingId ? updatedDocument : document
            );

            setDocuments(updatedDocuments);

            setEditingId(null);
            setNewDocument("");
            setDocumentType("Code Editor");
            setContent("");

            return;
        }

        // Otherwise, create a new document
        const response = await fetch("https://itsimplere-fullstack.onrender.com/api/documents", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title: newDocument,
                type: documentType,
                language: language
            })
        });

        if (!response.ok) {
            console.error("Could not create document");
            return;
        }

        const data = await response.json();

        setDocuments([...documents, data]);

        setNewDocument("");
    }

    // editDocument function (PUT)
    async function editDocument(id) {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `https://itsimplere-fullstack.onrender.com/api/documents/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const documentToEdit = await response.json();
            console.log(
                "Document returned by server:",
                JSON.stringify(documentToEdit, null, 2)
            );

            setNewDocument(documentToEdit.title);
            setDocumentType(documentToEdit.type);
            setContent(documentToEdit.content || "");
            setDocumentRole(documentToEdit.user_role);
            console.log("Current document role:", documentToEdit.user_role);
            setLanguage(documentToEdit.language || "javascript");
            setEditingId(id);
            loadVersions(id);

            if (editingId !== null) {
                socket.emit("leave-document", String(editingId));
            }

            socket.emit("join-document", String(id));

        } catch (error) {
            console.error("Error opening document:", error);
        }
    }

    // Retrieve versions loadVersion function
    async function loadVersions(id) {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `https://itsimplere-fullstack.onrender.com/api/documents/${id}/versions`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Could not retrieve versions");
            }

            const data = await response.json();

            setVersions(data);

        } catch (error) {
            console.error("Error loading versions:", error);
        }
    }

    // restore function
    async function restoreVersion(versionId) {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `https://itsimplere-fullstack.onrender.com/api/documents/${editingId}/versions/${versionId}/restore`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Could not restore version");
            }

            const data = await response.json();

            setContent(data.document.content || "");
            setLanguage(data.document.language || "javascript");

            await loadVersions(editingId);

            alert("Version restored successfully!");

        } catch (error) {
            console.error("Error restoring version:", error);
        }
    }

    async function deleteDocument(id) {
        const token = localStorage.getItem("token");

        await fetch(`https://itsimplere-fullstack.onrender.com/api/documents/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const updatedDocuments = documents.filter(
            document => document.id !== id
        );

        setDocuments(updatedDocuments);
    }

    return (
        !user ? (
            <Login onLogin={setUser} />
        ) : (
            <div className="dashboard">
                <Sidebar />

                <main className="main-content">

                    <div className="dashboard-header">
                        <div>
                            <h2>My Documents</h2>
                            <p>Manage your collaborative workspaces.</p>
                        </div>

                        <button
                            className="logout-button"
                            onClick={() => {
                                socket.disconnect();
                                localStorage.removeItem("token");
                                setUser(null);
                                setDocuments([]);
                                setEditingId(null);
                                setDocumentRole(null);
                            }}
                        >
                            Logout
                        </button>
                    </div>

                    <div className="document-actions">
                        <input
                            type="text"
                            placeholder="Enter document name"
                            value={newDocument}
                            onChange={(event) =>
                                setNewDocument(event.target.value)
                            }
                        />

                        <select
                            value={documentType}
                            onChange={(event) =>
                                setDocumentType(event.target.value)
                            }
                        >
                            <option value="Code Editor">Code Editor</option>
                            <option value="Whiteboard">Whiteboard</option>
                        </select>

                        {(editingId === null || documentRole === "Owner" || documentRole === "Editor") && (
                            <button onClick={createDocument}>
                                {editingId !== null ? "Update Document" : "Create Document"}
                            </button>
                        )}
                    </div>

                    {editingId !== null && (
                        <div>
                            <button
                                className="close-workspace-button"
                                onClick={() => {
                                    socket.emit("leave-document", String(editingId));
                                    setEditingId(null);
                                    setDocumentRole(null);
                                    setVersions([]);
                                    setContent("");
                                    setNewDocument("");
                                    setDocumentType("Code Editor");
                                }}
                            >
                                Back to Documents
                            </button>

                            <div className="workspace-header">
                                <div>
                                    <h2>{newDocument}</h2>
                                    <p>{documentType} Workspace</p>
                                </div>

                                <div className="workspace-info">
                                    <span className="workspace-type">
                                        {documentType}
                                    </span>

                                    <span className="workspace-role">
                                        {documentRole}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {editingId !== null && documentType === "Code Editor" && (
                        <div className="workspace">
                            <div className="editor-toolbar">
                                <div>
                                    <h3>Code Editor</h3>
                                    <p>Select your programming language</p>
                                </div>

                                <select
                                    value={language}
                                    onChange={(event) => setLanguage(event.target.value)}
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="cpp">C++</option>
                                    <option value="html">HTML</option>
                                </select>
                            </div>

                            <CodeEditor
                                value={content}
                                language={language}
                                onChange={(updatedContent) => {
                                    setContent(updatedContent);

                                    clearTimeout(saveTimer.current);

                                    saveTimer.current = setTimeout(() => {
                                        socket.emit("document-change", {
                                            documentId: String(editingId),
                                            content: updatedContent
                                        });
                                    }, 500);
                                }}
                            />
                        </div>
                    )}

                    {editingId !== null && documentType === "Whiteboard" && (
                        <div className="workspace">

                            <Whiteboard
                                content={content}
                                onChange={(updatedContent) => {
                                    setContent(updatedContent);

                                    clearTimeout(saveTimer.current);

                                    saveTimer.current = setTimeout(() => {
                                        socket.emit("document-change", {
                                            documentId: String(editingId),
                                            content: updatedContent
                                        });
                                    }, 500);
                                }}
                            />
                        </div>
                    )}

                    {editingId !== null && (
                        <div className="version-history">
                            <h3>Version History</h3>

                            {versions.length === 0 ? (
                                <p>No saved versions yet.</p>
                            ) : (
                                versions.map((version) => (
                                    <div key={version.id}>
                                        <p>Version {version.version_number}</p>

                                        <p>
                                            Created: {new Date(version.created_at).toLocaleString()}
                                        </p>

                                        {(documentRole === "Owner" || documentRole === "Editor") && (
                                            <button onClick={() => restoreVersion(version.id)}>
                                                Restore this version
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {editingId !== null && documentRole === "Owner" && (
                        <ShareDocument documentId={editingId} />
                    )}

                    <div className="document-list">
                        {documents.map((document) => (
                            <DocumentCard
                                key={document.id}
                                id={document.id}
                                title={document.title}
                                type={document.type}
                                userRole={document.user_role}
                                onDelete={deleteDocument}
                                onEdit={editDocument}
                            />
                        ))}
                    </div>
                </main>
            </div>
        )
    );
}

export default Dashboard;
