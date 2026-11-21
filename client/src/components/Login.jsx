import { useState } from "react";
import socket from "../socket";

function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [success, setSuccess] = useState("");

    async function handleLogin(event) {
        event.preventDefault();

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Login failed");
                return;
            }

           localStorage.setItem("token", data.token);

            socket.auth = {
            token: data.token
        };

socket.connect();

onLogin(data.user);

        } catch (error) {
            setError("Could not connect to the server");
        }
    }

        async function handleRegister(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed");
                return;
            }

            setSuccess("Registration successful! You can now log in.");
            setIsRegistering(false);
            setUsername("");
            setPassword("");

        } catch (error) {
            setError("Could not connect to the server");
        }
    }

    return (
        <div>
            <h2>{isRegistering ? "Create an Account" : "Login"}</h2>

            <form onSubmit={isRegistering ? handleRegister : handleLogin}>

                {isRegistering && (
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        required
                    />
                )}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />

                <button type="submit">
                    {isRegistering ? "Register" : "Login"}
                </button>
            </form>

            <button
                type="button"
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError("");
                    setSuccess("");
                }}
            >
            {isRegistering
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </button>

            {error && <p style={{ color: "#ef4444" }}>{error}</p>}

            {success && <p style={{ color: "#22c55e" }}>{success}</p>}
        </div>
    );
}

export default Login;