import React, { useState } from "react";
import API from "../api";
import "./Login.css";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // Step 1: Request OTP, Step 2: Verify OTP

  // Request OTP
  const requestOtp = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/request-otp", { phone });
      setStep(2); // Move to OTP verification step
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to request OTP");
    }
  };

  // Verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/verify-otp", { phone, code: otp });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/";
    } catch (err) {
      alert(err.response?.data?.msg || "Invalid OTP");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">💞 Welcome Back</h2>
        <p className="login-subtitle">
          Log in with your phone number and continue your love journey together.
        </p>

        {step === 1 ? (
          <form onSubmit={requestOtp} className="login-form">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your Phone Number"
              type="tel"
              className="login-input"
            />
            <button type="submit" className="login-btn">
              Request OTP 📩
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="login-form">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              type="number"
              className="login-input"
            />
            <button type="submit" className="login-btn">
              Verify OTP ✅
            </button>
          </form>
        )}

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
