"use client";

import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    if (response.ok) {
      window.location.assign("/canvas");
      return;
    }

    setError("Could not create account.");
  }

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", padding: "0 1rem", fontFamily: "sans-serif" }}>
      <h1>Create account</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Password
          <input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit">Create account</button>
      </form>
    </main>
  );
}
