import { useState } from "react";
import { API_BASE_URL } from "../api";
import "./Settings.css";

function Settings({
    user,
    preferences,
    onPreferencesSaved,
    onUserUpdated,
    onAccountDeleted
}) {
    const [displayName, setDisplayName] = useState(user.username);
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [settingsForm, setSettingsForm] = useState(preferences);
    const [settingsMessage, setSettingsMessage] = useState("");
    const [settingsError, setSettingsError] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [deleteMessage, setDeleteMessage] = useState("");
    const [deleteError, setDeleteError] = useState(false);
    const [deleteSaving, setDeleteSaving] = useState(false);

    async function handleProfileSave(event) {
        event.preventDefault();
        setProfileMessage("");
        setProfileSaving(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ username: displayName })
            });
            const data = await response.json();

            if (!response.ok) {
                setProfileError(true);
                setProfileMessage(data.message || "Could not update your profile.");
                return;
            }

            setProfileError(false);
            setProfileMessage("Profile updated.");
            onUserUpdated(data.user);
        } catch {
            setProfileError(true);
            setProfileMessage("Could not connect to the server.");
        } finally {
            setProfileSaving(false);
        }
    }

    async function handlePasswordChange(event) {
        event.preventDefault();
        setPasswordMessage("");

        if (newPassword !== confirmPassword) {
            setPasswordError(true);
            setPasswordMessage("The new passwords don't match.");
            return;
        }

        setPasswordSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();

            if (!response.ok) {
                setPasswordError(true);
                setPasswordMessage(data.message || "Could not change your password.");
                return;
            }

            setPasswordError(false);
            setPasswordMessage(data.message);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            setPasswordError(true);
            setPasswordMessage("Could not connect to the server.");
        } finally {
            setPasswordSaving(false);
        }
    }

    async function handlePreferencesSave(event) {
        event.preventDefault();
        setSettingsMessage("");
        setSettingsSaving(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(settingsForm)
            });
            const data = await response.json();

            if (!response.ok) {
                setSettingsError(true);
                setSettingsMessage(data.message || "Could not save your settings.");
                return;
            }

            setSettingsError(false);
            setSettingsForm(data.settings);
            onPreferencesSaved(data.settings);
            setSettingsMessage("Preferences saved.");
        } catch {
            setSettingsError(true);
            setSettingsMessage("Could not connect to the server.");
        } finally {
            setSettingsSaving(false);
        }
    }

    async function handleAccountDelete(event) {
        event.preventDefault();
        setDeleteMessage("");
        setDeleteSaving(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/account`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    currentPassword: deletePassword,
                    confirmation: deleteConfirmation
                })
            });
            const data = await response.json();

            if (!response.ok) {
                setDeleteError(true);
                setDeleteMessage(
                    data.ownedDocumentCount
                        ? `${data.message} You own ${data.ownedDocumentCount} document${data.ownedDocumentCount === 1 ? "" : "s"}.`
                        : data.message || "Could not delete your account."
                );
                return;
            }

            onAccountDeleted();
        } catch {
            setDeleteError(true);
            setDeleteMessage("Could not connect to the server.");
        } finally {
            setDeleteSaving(false);
        }
    }

    function updateSetting(name, value) {
        setSettingsForm(previous => ({ ...previous, [name]: value }));
    }

    return (
        <div className="settings-page">
            <details className="settings-section" name="settings-features">
                <summary><h3>Profile</h3></summary>
                <p className="settings-description">
                    Choose the name collaborators see in CodeSync.
                </p>
                <form className="settings-form" onSubmit={handleProfileSave}>
                    <label className="settings-field">
                        Display name
                        <input
                            type="text"
                            value={displayName}
                            onChange={event => setDisplayName(event.target.value)}
                            maxLength={50}
                            required
                        />
                    </label>
                    <label className="settings-field">
                        Email
                        <input type="email" value={user.email} readOnly />
                    </label>
                    <button type="submit" disabled={profileSaving}>
                        {profileSaving ? "Saving..." : "Save profile"}
                    </button>
                    {profileMessage && (
                        <p className={`settings-feedback${profileError ? " is-error" : ""}`} role={profileError ? "alert" : "status"}>
                            {profileMessage}
                        </p>
                    )}
                </form>
            </details>

            <details className="settings-section" name="settings-features">
                <summary><h3>Security</h3></summary>
                <p className="settings-description">Change your account password.</p>
                <form className="settings-form" onSubmit={handlePasswordChange}>
                    <label className="settings-field">
                        Current password
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={event => setCurrentPassword(event.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </label>
                    <label className="settings-field">
                        New password
                        <input
                            type="password"
                            value={newPassword}
                            onChange={event => setNewPassword(event.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            required
                        />
                    </label>
                    <label className="settings-field">
                        Confirm new password
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={event => setConfirmPassword(event.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            required
                        />
                    </label>
                    <button type="submit" disabled={passwordSaving}>
                        {passwordSaving ? "Changing..." : "Change password"}
                    </button>
                    {passwordMessage && (
                        <p className={`settings-feedback${passwordError ? " is-error" : ""}`} role={passwordError ? "alert" : "status"}>
                            {passwordMessage}
                        </p>
                    )}
                </form>
            </details>

            <details className="settings-section" name="settings-features">
                <summary><h3>Editor and appearance</h3></summary>
                <p className="settings-description">
                    Set your default editor behavior and display theme.
                </p>
                <form className="settings-form" onSubmit={handlePreferencesSave}>
                    <label className="settings-field">
                        Default programming language
                        <select
                            value={settingsForm.default_language}
                            onChange={event => updateSetting("default_language", event.target.value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="html">HTML</option>
                        </select>
                    </label>
                    <label className="settings-field">
                        Autosave delay
                        <select
                            value={settingsForm.autosave_delay_ms}
                            onChange={event => updateSetting("autosave_delay_ms", Number(event.target.value))}
                        >
                            <option value={500}>0.5 seconds</option>
                            <option value={1000}>1 second</option>
                            <option value={2000}>2 seconds</option>
                        </select>
                    </label>
                    <label className="settings-field">
                        Appearance
                        <select
                            value={settingsForm.theme}
                            onChange={event => updateSetting("theme", event.target.value)}
                        >
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </label>
                    <label className="settings-checkbox">
                        <input
                            type="checkbox"
                            checked={settingsForm.notify_on_share}
                            onChange={event => updateSetting("notify_on_share", event.target.checked)}
                        />
                        Email me when a document is shared with me
                    </label>
                    <p className="settings-description">
                        Sharing emails require the administrator to configure SMTP.
                    </p>
                    <button type="submit" disabled={settingsSaving}>
                        {settingsSaving ? "Saving..." : "Save preferences"}
                    </button>
                    {settingsMessage && (
                        <p className={`settings-feedback${settingsError ? " is-error" : ""}`} role={settingsError ? "alert" : "status"}>
                            {settingsMessage}
                        </p>
                    )}
                </form>
            </details>

            <details className="settings-section settings-danger-zone" name="settings-features">
                <summary><h3>Delete account</h3></summary>
                <p className="settings-description">
                    This permanently deletes your account and removes your access to shared documents.
                    Accounts that own documents cannot be deleted until those documents are deleted.
                    Your authorship on other people&apos;s version history will be anonymized.
                </p>
                <form className="settings-form" onSubmit={handleAccountDelete}>
                    <label className="settings-field">
                        Current password
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={event => setDeletePassword(event.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </label>
                    <label className="settings-field">
                        Type DELETE to confirm
                        <input
                            type="text"
                            value={deleteConfirmation}
                            onChange={event => setDeleteConfirmation(event.target.value)}
                            autoComplete="off"
                            required
                        />
                    </label>
                    <button
                        className="settings-delete-button"
                        type="submit"
                        disabled={deleteSaving || deleteConfirmation !== "DELETE"}
                    >
                        {deleteSaving ? "Deleting..." : "Delete account"}
                    </button>
                    {deleteMessage && (
                        <p className={`settings-feedback${deleteError ? " is-error" : ""}`} role={deleteError ? "alert" : "status"}>
                            {deleteMessage}
                        </p>
                    )}
                </form>
            </details>
        </div>
    );
}

export default Settings;
