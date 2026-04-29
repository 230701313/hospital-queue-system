// src/pages/RegisterPage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", age: "", role: "patient",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register({ ...form, age: Number(form.age) });
      if (user.role === "doctor") navigate("/doctor");
      else if (user.role === "admin") navigate("/admin");
      else navigate("/patient");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Medi<span>Queue</span></div>
        <p className="auth-subtitle">Create your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" required placeholder="John Doe" value={form.name} onChange={set("name")} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input type="number" required min="1" max="120" placeholder="35" value={form.age} onChange={set("age")} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" required placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required placeholder="you@example.com" value={form.email} onChange={set("email")} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required minLength="6" placeholder="Min 6 characters" value={form.password} onChange={set("password")} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={form.role} onChange={set("role")}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
