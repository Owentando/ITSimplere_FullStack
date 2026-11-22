import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";
import socket from "../socket";
import "./Login.css";

function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isRequestingReset, setIsRequestingReset] = useState(false);
    const [resetToken, setResetToken] = useState(() => (
        new URLSearchParams(window.location.search).get("resetToken") || ""
    ));
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (resetToken) {
            const url = new URL(window.location.href);
            url.searchParams.delete("resetToken");
            window.history.replaceState(null, "", url);
        }
    }, [resetToken]);

    async function handleLogin(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "We couldn't sign you in. Check your details and try again.");
                return;
            }

            localStorage.setItem("token", data.token);
            socket.auth = { token: data.token };
            socket.connect();
            onLogin(data.user);
        } catch {
            setError(`Can't reach the server. Make sure the backend is running at ${API_BASE_URL}.`);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleRegister(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "We couldn't create your account. Please try again.");
                return;
            }

            setSuccess("Your account is ready. Sign in to open your workspace.");
            setIsRegistering(false);
            setUsername("");
            setPassword("");
        } catch {
            setError(`Can't reach the server. Make sure the backend is running at ${API_BASE_URL}.`);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handlePasswordResetRequest(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "We couldn't send a reset link. Please try again.");
                return;
            }

            setSuccess(data.message);
        } catch {
            setError(`Can't reach the server. Make sure the backend is running at ${API_BASE_URL}.`);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handlePasswordReset(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("The passwords don't match.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token: resetToken, password })
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "We couldn't reset your password. Request a new link and try again.");
                return;
            }

            setSuccess(data.message);
            setResetToken("");
            setPassword("");
            setConfirmPassword("");
        } catch {
            setError(`Can't reach the server. Make sure the backend is running at ${API_BASE_URL}.`);
        } finally {
            setIsSubmitting(false);
        }
    }

    function toggleMode() {
        setIsRegistering(!isRegistering);
        setIsRequestingReset(false);
        setError("");
        setSuccess("");
    }

    function showPasswordResetRequest() {
        setIsRegistering(false);
        setIsRequestingReset(true);
        setError("");
        setSuccess("");
    }

    function returnToSignIn() {
        setResetToken("");
        setIsRequestingReset(false);
        setIsRegistering(false);
        setPassword("");
        setConfirmPassword("");
        setError("");
        setSuccess("");
    }

    const isResettingPassword = Boolean(resetToken);
    const isLogin = !isRegistering && !isRequestingReset && !isResettingPassword;

    return (
        <main className="auth-page">
            <section className="auth-showcase" aria-label="About CodeSync">
                <a className="auth-brand" href="/" aria-label="CodeSync home">
                    <span className="auth-brand-mark" aria-hidden="true">&lt;/&gt;</span>
                    <span>CodeSync</span>
                </a>

                <div className="auth-showcase-content">
                    <span className="auth-eyebrow">BUILD TOGETHER</span>
                    <h1>Good ideas get better when they’re shared.</h1>
                    <p>
                        Your team's space for collaborative code, quick sketches,
                        and turning plans into progress.
                    </p>

                    <div className="auth-preview" aria-hidden="true">
                        <div className="auth-preview-top">
                            <span />
                            <span />
                            <span />
                            <span className="auth-preview-label">team-workspace.js</span>
                        </div>
                        <div className="auth-code">
                            <span><i>01</i> <b>const</b> ideas = [];</span>
                            <span><i>02</i> ideas.push(<em>"your next big thing"</em>);</span>
                            <span><i>03</i> <b>build</b>(ideas, <strong>together</strong>);</span>
                        </div>
                        <div className="auth-collaborators">
                            <span className="auth-avatar auth-avatar-one">A</span>
                            <span className="auth-avatar auth-avatar-two">J</span>
                            <span className="auth-avatar auth-avatar-three">M</span>
                            <span>Good work happens together</span>
                        </div>
                    </div>
                </div>

                <p className="auth-showcase-footer">A shared space for your team's next great idea.</p>
            </section>

            <section
                className="auth-panel"
                aria-label={
                    isRegistering
                        ? "Create your account"
                        : isResettingPassword
                            ? "Choose a new password"
                            : isRequestingReset
                                ? "Reset your password"
                                : "Sign in"
                }
            >
                <div className="auth-form-wrap">
                    <div className="auth-mobile-brand">
                        <span className="auth-brand-mark" aria-hidden="true">&lt;/&gt;</span>
                        <span>CodeSync</span>
                    </div>

                    <span className="auth-eyebrow">
                        {isRegistering
                            ? "GET STARTED"
                            : isResettingPassword || isRequestingReset
                                ? "ACCOUNT RECOVERY"
                                : "WELCOME BACK"}
                    </span>
                    <h2>
                        {isRegistering
                            ? "Create your account"
                            : isResettingPassword
                                ? "Choose a new password"
                                : isRequestingReset
                                    ? "Reset your password"
                                    : "Sign in to CodeSync"}
                    </h2>
                    <p className="auth-intro">
                        {isRegistering
                            ? "Set up your account and start building together."
                            : isResettingPassword
                                ? "Choose a new password for your CodeSync account."
                                : isRequestingReset
                                    ? "Enter the email address linked to your account and we'll send you a reset link."
                                    : "Pick up where your team left off."}
                    </p>

                    <form
                        className="auth-form"
                        onSubmit={
                            isRegistering
                                ? handleRegister
                                : isResettingPassword
                                    ? handlePasswordReset
                                    : isRequestingReset
                                        ? handlePasswordResetRequest
                                        : handleLogin
                        }
                        aria-busy={isSubmitting}
                    >
                        {isRegistering && (
                            <div className="auth-field">
                                <label htmlFor="auth-username">Your name</label>
                                <input
                                    id="auth-username"
                                    type="text"
                                    placeholder="e.g. Alex Morgan"
                                    autoComplete="name"
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {!isResettingPassword && (
                            <div className="auth-field">
                                <label htmlFor="auth-email">Work email</label>
                                <input
                                    id="auth-email"
                                    type="email"
                                    placeholder="you@company.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {!isRequestingReset && (
                            <div className="auth-field">
                                <label htmlFor="auth-password">
                                    {isResettingPassword ? "New password" : "Password"}
                                </label>
                                <div className="auth-password-input">
                                    <input
                                        id="auth-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder={
                                            isResettingPassword
                                                ? "Choose at least 8 characters"
                                                : isRegistering
                                                    ? "Create a password"
                                                    : "Enter your password"
                                        }
                                        autoComplete={isRegistering || isResettingPassword ? "new-password" : "current-password"}
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        minLength={isResettingPassword ? 8 : undefined}
                                        maxLength={isResettingPassword ? 72 : undefined}
                                        required
                                    />
                                    {!isResettingPassword && (
                                        <button
                                            className="auth-password-toggle"
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    )}
                                </div>
                                {isResettingPassword && (
                                    <p className="auth-field-hint">Use 8 to 72 characters.</p>
                                )}
                                {isLogin && (
                                    <button
                                        className="auth-inline-link"
                                        type="button"
                                        onClick={showPasswordResetRequest}
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                        )}

                        {isResettingPassword && (
                            <div className="auth-field">
                                <label htmlFor="auth-confirm-password">Confirm new password</label>
                                <input
                                    id="auth-confirm-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your new password again"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    minLength={8}
                                    maxLength={72}
                                    required
                                />
                            </div>
                        )}

                        {error && (
                            <p className="auth-message auth-error" role="alert">
                                {error}
                            </p>
                        )}
                        {success && (
                            <p className="auth-message auth-success" role="status">
                                {success}
                            </p>
                        )}

                        <button className="auth-submit" type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? isRegistering
                                    ? "Creating account..."
                                    : isResettingPassword
                                        ? "Updating password..."
                                        : isRequestingReset
                                            ? "Sending reset link..."
                                            : "Signing in..."
                                : isRegistering
                                    ? "Create account"
                                    : isResettingPassword
                                        ? "Update password"
                                        : isRequestingReset
                                            ? "Send reset link"
                                            : "Sign in"}
                            {!isSubmitting && <span aria-hidden="true">→</span>}
                        </button>
                    </form>

                    <p className="auth-switch">
                        {isRegistering
                            ? "Already have an account?"
                            : isLogin
                                ? "New to CodeSync?"
                                : ""}
                        {(isRegistering || isLogin) && (
                            <button type="button" onClick={toggleMode}>
                                {isRegistering ? "Sign in" : "Create an account"}
                            </button>
                        )}
                        {(isRequestingReset || isResettingPassword) && (
                            <button type="button" onClick={returnToSignIn}>
                                Back to sign in
                            </button>
                        )}
                    </p>

                    <p className="auth-privacy">
                        Your workspace is just for you and the people you invite.
                    </p>
                </div>
            </section>
        </main>
    );
}

export default Login;
