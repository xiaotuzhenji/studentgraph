"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
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

    setError("登录失败，请检查邮箱和密码。");
  }

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <aside className="auth-hero card">
          <span className="auth-kicker">知枝</span>
          <h1>把问题变成一张会生长的学习图谱。</h1>
          <p className="lead">输入一个问题、链接、项目或书籍，AI 会帮你拆解、展开、提问，并沉淀成个人知识库。</p>
          <div className="auth-points">
            <span>无线画布</span>
            <span>AI 拆解</span>
            <span>笔记分支</span>
            <span>知识库沉淀</span>
          </div>
        </aside>

        <section className="auth-panel card">
          <div className="auth-panel-head">
            <h2>登录知枝</h2>
            <p>继续你的学习图谱。</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field auth-field">
              <span>邮箱</span>
              <input name="email" type="email" autoComplete="email" placeholder="name@example.com" required />
            </label>
            <label className="field auth-field">
              <span>密码</span>
              <input name="password" type="password" autoComplete="current-password" minLength={8} placeholder="输入密码" required />
            </label>
            {error ? <p role="alert" className="auth-error">{error}</p> : null}
            <button type="submit" className="btn btn-primary auth-submit">登录</button>
          </form>
          <p className="auth-footnote">
            还没有账号？<a href="/register">去注册</a>
          </p>
        </section>
      </section>
    </main>
  );
}
