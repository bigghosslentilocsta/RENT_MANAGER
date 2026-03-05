import { useState } from "react";

const VALID_USERNAME = "PUNNAM444";
const VALID_PASSWORD = "PUNNAM444";

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      localStorage.setItem("isLoggedIn", "true");
      onLoginSuccess();
      return;
    }

    setError("Invalid username or password.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/60 bg-white/90 p-6 sm:p-8 shadow-card backdrop-blur-xl">
        <h1 className="text-xl sm:text-2xl font-semibold text-center">Login</h1>
        <p className="mt-2 text-xs sm:text-sm text-muted text-center">Sign in to continue to Rent Manager.</p>

        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
          <label className="block text-xs sm:text-sm font-semibold text-muted">
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-xl sm:rounded-2xl border border-ink/10 px-3 sm:px-4 py-2 text-sm"
              required
            />
          </label>

          <label className="block text-xs sm:text-sm font-semibold text-muted">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl sm:rounded-2xl border border-ink/10 px-3 sm:px-4 py-2 text-sm"
              required
            />
          </label>

          {error ? <p className="text-xs sm:text-sm text-pending">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-full bg-ink px-4 py-2.5 text-xs sm:text-sm font-semibold text-white"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
