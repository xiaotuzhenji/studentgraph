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

    setError("注册失败，请检查邮箱是否已存在。");
  }

  return (
    <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: "2rem" }}>
      <section style={{ width: "100%", maxWidth: 420, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "2rem" }}>
        <h1 style={{ marginTop: 0 }}>创建账号</h1>
        <p style={{ color: "var(--muted)", marginTop: "-0.25rem" }}>先注册，再把问题、链接、书和项目丢进你的学习画布。</p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            邮箱
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            密码
            <input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </label>
          {error ? <p role="alert" style={{ color: "#b42318", margin: 0 }}>{error}</p> : null}
          <button type="submit">注册</button>
        </form>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          已有账号？<a href="/login">去登录</a>
        </p>
      </section>
    </main>
  );
}
