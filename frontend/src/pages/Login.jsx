import React, { useState } from "react";
import API from "../api";
import "./Login.css"; // Import the custom CSS

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/";
    } catch (e) {
      alert(e.response?.data?.msg || "Error");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">💞 Welcome Back</h2>
        <p className="login-subtitle">
          Log in and continue your love journey together.
        </p>

        <form onSubmit={submit} className="login-form">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your Email"
            type="email"
            className="login-input"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="login-input"
          />

          <button type="submit" className="login-btn">
            Login ❤️
          </button>
        </form>

        <p className="login-footer">
          Don’t have an account?{" "}
          <a href="/register" className="register-link">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
