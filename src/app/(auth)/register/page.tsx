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
    <main className="auth-page">
      <section className="auth-card card">
        <div className="auth-card-head">
          <a href="/canvas" className="auth-brand" aria-label="知枝">
            <span className="auth-brand-mark">知</span>
            <span className="auth-brand-copy">
              <strong>知枝</strong>
              <span>AI 学习画布</span>
            </span>
          </a>
          <h1>创建账号</h1>
          <p className="lead">先注册，再把问题、链接、项目和书籍丢进你的学习画布。</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field auth-field">
            <span>邮箱</span>
            <input name="email" type="email" autoComplete="email" placeholder="name@example.com" required />
          </label>
          <label className="field auth-field">
            <span>密码</span>
            <input name="password" type="password" autoComplete="new-password" minLength={8} placeholder="至少 8 位" required />
          </label>
          {error ? <p role="alert" className="auth-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary auth-submit">注册</button>
        </form>
        <div className="auth-card-foot">
          <div className="auth-points">
            <span>双击进详情</span>
            <span>选中文字提问</span>
            <span>多画布管理</span>
          </div>
          <p className="auth-footnote">
            已有账号？<a href="/login">去登录</a>
          </p>
        </div>
      </section>
    </main>
  );
}
