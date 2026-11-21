
function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">C</div>
                <h2>CodeSync</h2>
            </div>

            <p className="sidebar-label">WORKSPACE</p>

            <ul>
                <li className="active">
                    <span>▦</span>
                    Dashboard
                </li>

                <li>
                    <span>▤</span>
                    My Documents
                </li>

                <li>
                    <span>⇄</span>
                    Shared Documents
                </li>
            </ul>

            <p className="sidebar-label settings-label">PREFERENCES</p>

            <ul>
                <li>
                    <span>⚙</span>
                    Settings
                </li>
            </ul>

            <div className="sidebar-footer">
                <p>Collaborate. Create. Code.</p>
                <span>Full Stack Project</span>
            </div>
        </aside>
    );
}

export default Sidebar;
