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
      <section className="auth-card card">
        <div className="auth-card-head">
          <span className="auth-kicker">知枝</span>
          <h1>登录知枝</h1>
          <p className="lead">进入你的学习画布，继续把内容展开成知识图谱。</p>
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
        <div className="auth-card-foot">
          <div className="auth-points">
            <span>无线画布</span>
            <span>AI 拆解</span>
            <span>知识库沉淀</span>
          </div>
          <p className="auth-footnote">
            还没有账号？<a href="/register">去注册</a>
          </p>
        </div>
      </section>
    </main>
  );
}
