import React, { useState } from "react";
import API from "../api";
import "./Register.css";

export default function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // Step 1: Request OTP, Step 2: Verify OTP

  // Step 1: Request OTP
  const requestOtp = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/request-otp", { phone });
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to request OTP");
    }
  };

  // Step 2: Verify OTP & create account
  const verifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/verify-otp", { phone, code: otp, name });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/";
    } catch (err) {
      alert(err.response?.data?.msg || "Invalid OTP");
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2 className="register-title">💕 Create Love Account</h2>
        <p className="register-subtitle">
          Join your partner and keep your love story alive.
        </p>

        {step === 1 ? (
          <form onSubmit={requestOtp} className="register-form">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="register-input"
              required
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your Phone Number"
              type="tel"
              className="register-input"
              required
            />
            <button type="submit" className="register-btn">
              Request OTP 📩
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="register-form">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              type="number"
              className="register-input"
              required
            />
            <button type="submit" className="register-btn">
              Verify OTP ✅
            </button>
          </form>
        )}

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
