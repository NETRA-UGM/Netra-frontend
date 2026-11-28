"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FiLock, FiUser } from "react-icons/fi";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Login gagal. Coba lagi.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError(
        "Tidak dapat terhubung ke NETRA. Periksa koneksi dan coba lagi.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="figma-login-form">
      <div className="figma-login-fields">
        <label className="figma-login-field">
          <FiUser size={14} aria-hidden="true" />
          <span className="sr-only">Username</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label className="figma-login-field">
          <FiLock size={14} aria-hidden="true" />
          <span className="sr-only">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
      </div>

      <p className="figma-login-terms">
        By Creating account means you agree to <span>Terms of Service</span> and{" "}
        <span>Privacy Policy</span>
      </p>
      {error && (
        <p role="alert" className="figma-login-error">
          {error}
        </p>
      )}
      <button type="submit" className="figma-login-submit" disabled={pending}>
        {pending ? "LOGGING IN..." : "LOGIN"}
      </button>
    </form>
  );
}
