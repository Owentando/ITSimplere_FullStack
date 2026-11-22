
function Sidebar({ isOpen, onClose, activeSection, onNavigate }) {
    return (
        <>
            {isOpen && (
                <button
                    className="sidebar-backdrop"
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={onClose}
                />
            )}
            <aside
                className="sidebar"
                id="navigation-panel"
                aria-label="Main navigation"
                hidden={!isOpen}
            >
                <div className="sidebar-brand">
                    <div className="brand-icon">C</div>
                    <h2>CodeSync</h2>
                </div>

                <p className="sidebar-label">WORKSPACE</p>

                <ul>
                    <li>
                        <button
                            className={`sidebar-link${activeSection === "dashboard" ? " active" : ""}`}
                            type="button"
                            aria-current={activeSection === "dashboard" ? "page" : undefined}
                            onClick={() => onNavigate("dashboard")}
                        >
                            <span>▦</span>
                            Dashboard
                        </button>
                    </li>

                    <li>
                        <button
                            className={`sidebar-link${activeSection === "my-documents" ? " active" : ""}`}
                            type="button"
                            aria-current={activeSection === "my-documents" ? "page" : undefined}
                            onClick={() => onNavigate("my-documents")}
                        >
                            <span>▤</span>
                            My Documents
                        </button>
                    </li>

                    <li>
                        <button
                            className={`sidebar-link${activeSection === "shared-documents" ? " active" : ""}`}
                            type="button"
                            aria-current={activeSection === "shared-documents" ? "page" : undefined}
                            onClick={() => onNavigate("shared-documents")}
                        >
                            <span>⇄</span>
                            Shared Documents
                        </button>
                    </li>
                </ul>

                <p className="sidebar-label settings-label">PREFERENCES</p>

                <ul>
                    <li>
                        <button
                            className={`sidebar-link${activeSection === "settings" ? " active" : ""}`}
                            type="button"
                            aria-current={activeSection === "settings" ? "page" : undefined}
                            onClick={() => onNavigate("settings")}
                        >
                            <span>⚙</span>
                            Settings
                        </button>
                    </li>
                </ul>

                <div className="sidebar-footer">
                    <p>Collaborate. Create. Code.</p>
                    <span>Full Stack Project</span>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
