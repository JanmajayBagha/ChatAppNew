import React, { useState } from "react";
import API from "../api";
import "./Register.css"; // Import the custom CSS

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/register", { name, email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/";
    } catch (e) {
      alert(e.response?.data?.msg || "Error");
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2 className="register-title">💕 Create Love Account</h2>
        <p className="register-subtitle">
          Join your partner and keep your love story alive.
        </p>

        <form onSubmit={submit} className="register-form">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="register-input"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your Email"
            type="email"
            className="register-input"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="register-input"
          />

          <button type="submit" className="register-btn">
            Register ❤️
          </button>
        </form>

        <p className="register-footer">
          Already have an account?{" "}
          <a href="/login" className="login-link">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
