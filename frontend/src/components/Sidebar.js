// src/components/Sidebar.js
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const navItems = {
  patient: [
    { label: "Book Appointment", icon: "📅", view: "book" },
    { label: "My Queue Status", icon: "🔢", view: "status" },
    { label: "My Appointments", icon: "📋", view: "appointments" },
  ],
  doctor: [
    { label: "My Queue", icon: "👥", view: "queue" },
    { label: "Consultation", icon: "🩺", view: "consult" },
  ],
  admin: [
    { label: "Overview", icon: "📊", view: "overview" },
    { label: "All Queues", icon: "🏥", view: "queues" },
    { label: "Manage Doctors", icon: "👨‍⚕️", view: "doctors" },
    { label: "Patients", icon: "👥", view: "patients" },
  ],
};

export default function Sidebar({ activeView, setView }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const items = navItems[user?.role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Medi<span>Queue</span></div>

      {items.map((item) => (
        <button
          key={item.view}
          className={`nav-item ${activeView === item.view ? "active" : ""}`}
          onClick={() => setView(item.view)}
        >
          <span className="icon">{item.icon}</span>
          {item.label}
        </button>
      ))}

      <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ padding: "0 12px 12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <div style={{ fontWeight: 600, color: "var(--text)" }}>{user?.name}</div>
          <div style={{ textTransform: "capitalize" }}>{user?.role}</div>
        </div>
        <button className="nav-item" onClick={handleLogout}>
          <span className="icon">🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
