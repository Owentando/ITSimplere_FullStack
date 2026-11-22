
import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../api";
import DocumentCard from "../components/DocumentCard";
import Sidebar from "../components/Sidebar";
import socket from "../socket";
import CodeEditor from "../components/CodeEditor";
import Whiteboard from "../components/Whiteboard";
import Login from "../components/Login";
import ShareDocument from "../components/ShareDocument";
import Navbar from "../components/Navbar";
import Settings from "../components/Settings";

const DEFAULT_USER_SETTINGS = {
    default_language: "javascript",
    autosave_delay_ms: 500,
    theme: "dark",
    notify_on_share: false
};

function getWorkspaceDocumentId() {
    const match = window.location.pathname.match(/^\/documents\/(\d+)\/?$/);
    return match ? Number(match[1]) : null;
}

function Dashboard() {

    const [documents, setDocuments] = useState([]);
    const [newDocument, setNewDocument] = useState("");
    const [documentType, setDocumentType] = useState("Code Editor");
    const [versions, setVersions] = useState([]);
    const [content, setContent] = useState("");
    const [language, setLanguage] = useState("javascript");
    const saveTimer = useRef(null);
    const [editingId, setEditingId] = useState(null);
    const [routeDocumentId, setRouteDocumentId] = useState(getWorkspaceDocumentId);
    const workspaceHistoryEntry = useRef(false);
    const editDocumentRef = useRef(null);
    const clearWorkspaceRef = useRef(null);
    const [user, setUser] = useState(null);
    const [documentRole, setDocumentRole] = useState(null);
    const [isNavigationOpen, setIsNavigationOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("dashboard");
    const [userSettings, setUserSettings] = useState(DEFAULT_USER_SETTINGS);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsError, setSettingsError] = useState("");
    const [settingsReloadCount, setSettingsReloadCount] = useState(0);
    const [theme, setTheme] = useState(() => (
        localStorage.getItem("codesync-theme") === "light" ? "light" : "dark"
    ));

    function clearWorkspace() {
        if (editingId !== null) {
            socket.emit("leave-document", String(editingId));
        }

        setRouteDocumentId(null);
        setEditingId(null);
        setDocumentRole(null);
        setVersions([]);
        setContent("");
        setNewDocument("");
        setDocumentType("Code Editor");
    }

    function closeWorkspace() {
        if (workspaceHistoryEntry.current) {
            workspaceHistoryEntry.current = false;
            window.history.back();
            return;
        }

        if (getWorkspaceDocumentId() !== null) {
            window.history.replaceState({}, "", "/");
        }

        clearWorkspace();
    }

    useEffect(() => {
        clearWorkspaceRef.current = clearWorkspace;
        editDocumentRef.current = editDocument;
    });

    useEffect(() => {
        if (!isNavigationOpen) {
            return;
        }

        function closeOnEscape(event) {
            if (event.key === "Escape") {
                setIsNavigationOpen(false);
            }
        }

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [isNavigationOpen]);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("codesync-theme", theme);
    }, [theme]);

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

        fetch(`${API_BASE_URL}/api/auth/profile`, {
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

    useEffect(() => {
        if (user?.id && routeDocumentId !== null && editingId !== routeDocumentId) {
            editDocumentRef.current(routeDocumentId, false);
        }
    }, [user?.id, routeDocumentId, editingId]);

    useEffect(() => {
        function handlePopState() {
            const documentId = getWorkspaceDocumentId();
            workspaceHistoryEntry.current = false;

            if (documentId === null) {
                clearWorkspaceRef.current();
                return;
            }

            clearWorkspaceRef.current();
            setRouteDocumentId(documentId);
        }

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [editingId]);

    useEffect(() => {
        const userId = user?.id;
        if (!userId) {
            return;
        }

        let isCurrent = true;
        const token = localStorage.getItem("token");

        fetch(`${API_BASE_URL}/api/auth/settings`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(async response => {
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(
                        data.message || `Settings request failed (${response.status}).`
                    );
                }
                return response.json();
            })
            .then(data => {
                if (!isCurrent) {
                    return;
                }
                setUserSettings(data.settings);
                setLanguage(data.settings.default_language);
                setTheme(data.settings.theme);
            })
            .catch(error => {
                if (isCurrent) {
                    console.error("Settings loading error:", error);
                    setSettingsError(error.message || "Could not retrieve your settings.");
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setSettingsLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [user?.id, settingsReloadCount]);

    // Retrieve documents from the backend
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("No login token found.");
            setDocuments([]);
            return;
        }

        fetch(`${API_BASE_URL}/api/documents`, {
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
                `${API_BASE_URL}/api/documents/${editingId}`,
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
            closeWorkspace();

            return;
        }

        // Otherwise, create a new document
        const response = await fetch(`${API_BASE_URL}/api/documents`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title: newDocument,
                type: documentType,
                language: userSettings.default_language
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
    async function editDocument(id, shouldNavigate = true) {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/api/documents/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Could not retrieve this document.");
            }

            const documentToEdit = await response.json();
            console.log(
                "Document returned by server:",
                JSON.stringify(documentToEdit, null, 2)
            );

            if (shouldNavigate) {
                window.history.pushState({}, "", `/documents/${id}`);
                workspaceHistoryEntry.current = true;
            }

            setNewDocument(documentToEdit.title);
            setDocumentType(documentToEdit.type);
            setContent(documentToEdit.content || "");
            setDocumentRole(documentToEdit.user_role);
            console.log("Current document role:", documentToEdit.user_role);
            setLanguage(documentToEdit.language || "javascript");
            setEditingId(id);
            setRouteDocumentId(id);
            loadVersions(id);

            if (editingId !== null) {
                socket.emit("leave-document", String(editingId));
            }

            socket.emit("join-document", String(id));

        } catch (error) {
            console.error("Error opening document:", error);
            if (!shouldNavigate && Number(id) === getWorkspaceDocumentId()) {
                window.history.replaceState({}, "", "/");
                workspaceHistoryEntry.current = false;
                setRouteDocumentId(null);
            }
        }
    }

    // Retrieve versions loadVersion function
    async function loadVersions(id) {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/api/documents/${id}/versions`,
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
                `${API_BASE_URL}/api/documents/${editingId}/versions/${versionId}/restore`,
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

        await fetch(`${API_BASE_URL}/api/documents/${id}`, {
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

    const visibleDocuments = activeSection === "my-documents"
        ? documents.filter(document => document.user_role === "Owner")
        : activeSection === "shared-documents"
            ? documents.filter(document => document.user_role !== "Owner")
            : documents;
    const isWorkspacePage = editingId !== null || routeDocumentId !== null;
    const sectionTitle = isWorkspacePage
        ? newDocument || "Workspace"
        : activeSection === "settings"
            ? "Settings"
            : activeSection === "shared-documents"
                ? "Shared Documents"
                : activeSection === "my-documents"
                    ? "My Documents"
                    : "Dashboard";
    const emptyDocumentsMessage = activeSection === "shared-documents"
        ? "No documents have been shared with you yet."
        : activeSection === "my-documents"
            ? "You haven't created any documents yet."
            : "No documents yet.";

    return (
        !user ? (
            <Login onLogin={setUser} />
        ) : (
            <>
                <Navbar
                    user={user}
                    isMenuOpen={isNavigationOpen}
                    onMenuClick={() => setIsNavigationOpen(open => !open)}
                />
                <div className="dashboard">
                    <Sidebar
                        isOpen={isNavigationOpen}
                        onClose={() => setIsNavigationOpen(false)}
                        activeSection={activeSection}
                        onNavigate={section => {
                            if (isWorkspacePage) {
                                closeWorkspace();
                            }
                            setActiveSection(section);
                            setIsNavigationOpen(false);
                        }}
                    />

                    <main className={`main-content${isWorkspacePage ? " workspace-page-main" : ""}`}>

                    <div className="dashboard-header">
                        <div>
                            <h2>{sectionTitle}</h2>
                            <p>
                                {isWorkspacePage
                                    ? `${documentType} collaborative workspace`
                                    : activeSection === "settings"
                                        ? "Manage your account and workspace preferences."
                                        : activeSection === "shared-documents"
                                            ? "Workspaces shared with you by other collaborators."
                                            : "Manage your collaborative workspaces."}
                            </p>
                            {(isWorkspacePage || activeSection !== "dashboard") && (
                                <button
                                    className="back-navigation-button"
                                    type="button"
                                    onClick={() => {
                                        if (isWorkspacePage) {
                                            closeWorkspace();
                                        } else {
                                            setActiveSection("dashboard");
                                        }
                                    }}
                                >
                                    {isWorkspacePage ? "← Back to Documents" : "← Back to Dashboard"}
                                </button>
                            )}
                        </div>

                        {isWorkspacePage && editingId !== null && (
                            <div className="workspace-info">
                                <span className="workspace-type">{documentType}</span>
                                <span className="workspace-role">{documentRole}</span>
                            </div>
                        )}

                        <button
                            className="logout-button"
                            onClick={() => {
                                socket.disconnect();
                                workspaceHistoryEntry.current = false;
                                window.history.replaceState({}, "", "/");
                                localStorage.removeItem("token");
                                setUser(null);
                                setIsNavigationOpen(false);
                                setDocuments([]);
                                clearWorkspace();
                                setActiveSection("dashboard");
                                setSettingsLoading(true);
                                setSettingsError("");
                                setUserSettings(DEFAULT_USER_SETTINGS);
                                setLanguage("javascript");
                            }}
                        >
                            Logout
                        </button>
                    </div>

                    {isWorkspacePage && editingId === null ? (
                        <p>Loading workspace...</p>
                    ) : activeSection === "settings" ? (
                        settingsLoading ? (
                            <p>Loading settings...</p>
                        ) : settingsError ? (
                            <div className="settings-load-error">
                                <p className="settings-feedback is-error" role="alert">
                                    Could not load your settings: {settingsError}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSettingsError("");
                                        setSettingsLoading(true);
                                        setSettingsReloadCount(count => count + 1);
                                    }}
                                >
                                    Retry loading settings
                                </button>
                            </div>
                        ) : (
                            <Settings
                                key={user.id}
                                user={user}
                                preferences={userSettings}
                                onUserUpdated={setUser}
                                onPreferencesSaved={settings => {
                                    setUserSettings(settings);
                                    if (editingId === null) {
                                        setLanguage(settings.default_language);
                                    }
                                    setTheme(settings.theme);
                                }}
                                onAccountDeleted={() => {
                                    socket.disconnect();
                                    workspaceHistoryEntry.current = false;
                                    window.history.replaceState({}, "", "/");
                                    localStorage.removeItem("token");
                                    setUser(null);
                                    setDocuments([]);
                                    clearWorkspace();
                                    setActiveSection("dashboard");
                                    setSettingsLoading(true);
                                    setSettingsError("");
                                    setUserSettings(DEFAULT_USER_SETTINGS);
                                    setTheme("dark");
                                }}
                            />
                        )
                    ) : (
                        <>
                    {(activeSection !== "shared-documents" || editingId !== null) && (
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
                                theme={theme}
                                onChange={(updatedContent) => {
                                    setContent(updatedContent);

                                    clearTimeout(saveTimer.current);

                                    saveTimer.current = setTimeout(() => {
                                        socket.emit("document-change", {
                                            documentId: String(editingId),
                                            content: updatedContent
                                        });
                                    }, userSettings.autosave_delay_ms);
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
                                    }, userSettings.autosave_delay_ms);
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

                    {editingId === null && <div className="document-list">
                        {visibleDocuments.length === 0 ? (
                            <p className="empty-documents-message">{emptyDocumentsMessage}</p>
                        ) : visibleDocuments.map((document) => (
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
                    </div>}
                        </>
                    )}
                    </main>
                </div>
            </>
        )
    );
}

export default Dashboard;
