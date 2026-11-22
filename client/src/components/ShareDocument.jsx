
import { useState } from "react";
import { API_BASE_URL } from "../api";

function ShareDocument({ documentId }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Viewer");
    const [message, setMessage] = useState("");

    async function handleShare(event) {
        event.preventDefault();

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/documents/${documentId}/share`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email,
                        role
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Sharing failed");
                return;
            }

            setMessage(
                data.notificationWarning
                    ? `${data.message} ${data.notificationWarning}`
                    : data.message || "Document shared successfully!"
            );
            setEmail("");

        } catch (error) {
            console.error("Sharing error:", error);
            setMessage("Could not connect to the server");
        }
    }

    return (
        <div className="share-panel">
            <h3>Share Document</h3>
            <p className="share-description">
                Invite someone to collaborate on this document.
            </p>

            <form onSubmit={handleShare} className="share-form">
                <input
                    type="email"
                    placeholder="Enter user's email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                >
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                </select>

                <button type="submit">
                    Share
                </button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
}

export default ShareDocument;
