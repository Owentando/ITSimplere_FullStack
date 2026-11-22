function Navbar({ user, isMenuOpen, onMenuClick }) {
    return (
        <nav className="navbar">
            <button
                className={`nav-menu-button${isMenuOpen ? " is-open" : ""}`}
                type="button"
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMenuOpen}
                aria-controls="navigation-panel"
                onClick={onMenuClick}
            >
                <span />
                <span />
                <span />
            </button>
            <h1>CodeSync</h1>

            <p>Welcome, {user.username}</p>
        </nav>
    );
}

export default Navbar;