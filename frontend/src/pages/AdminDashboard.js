// src/pages/AdminDashboard.js
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

// ── Overview stats ────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/overview").then((r) => setStats(r.data));
    const interval = setInterval(() => api.get("/admin/overview").then((r) => setStats(r.data)), 10000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <p style={{ color: "var(--text-muted)" }}>Loading stats…</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Overview</h1>
        <p>Live hospital statistics</p>
      </div>
      <div className="card-grid" style={{ marginBottom: 28 }}>
        {[
          { label: "Total Patients", num: stats.totalPatients, icon: "👥" },
          { label: "Doctors", num: stats.totalDoctors, icon: "👨‍⚕️" },
          { label: "Waiting Now", num: stats.waitingCount, icon: "⏳" },
          { label: "In Progress", num: stats.inProgressCount, icon: "🩺" },
          { label: "Completed Today", num: stats.completedToday, icon: "✅" },
        ].map((s) => (
          <div key={s.label} className="card stat-card">
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── All queues monitor ────────────────────────────────────────
function AllQueues() {
  const [queues, setQueues] = useState([]);

  const load = () => api.get("/admin/queues").then((r) => setQueues(r.data));
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  const overridePriority = async (appointmentId, priority) => {
    await api.post("/queue/override", { appointmentId, priority });
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>All Queues</h1>
        <p>Monitor every doctor's queue. Override priority for emergencies.</p>
      </div>
      {queues.map((q) => (
        <div key={q.doctor._id} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "1.1rem" }}>
                Dr. {q.doctor.userId?.name}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {q.doctor.specialization} — {q.doctor.department}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>{q.waitingCount}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>waiting</div>
            </div>
          </div>
          {q.currentPatient && (
            <div style={{ padding: "8px 12px", background: "var(--surface2)", borderRadius: 8, marginBottom: 10, fontSize: "0.85rem" }}>
              🩺 Now seeing: <strong>{q.currentPatient.patient?.name || "—"}</strong>
            </div>
          )}
          {q.waitingCount === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Queue is clear ✅</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Manage Doctors ────────────────────────────────────────────
function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ userId: "", specialization: "", department: "", avgConsultationTime: 10 });
  const [success, setSuccess] = useState("");

  const load = () => {
    api.get("/doctors").then((r) => setDoctors(r.data));
    api.get("/admin/patients").then((r) => setPatients(r.data));
  };
  useEffect(load, []);

  const createDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.post("/doctors", form);
      setSuccess("Doctor profile created!");
      setForm({ userId: "", specialization: "", department: "", avgConsultationTime: 10 });
      load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const deleteDoctor = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;
    await api.delete(`/doctors/${id}`);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Manage Doctors</h1>
        <p>Create and remove doctor profiles</p>
      </div>
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: 24, maxWidth: 500 }}>
        <div className="section-title">Add Doctor Profile</div>
        <form onSubmit={createDoctor}>
          <div className="form-group">
            <label>Select User (registered as doctor)</label>
            <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">-- Select User --</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Specialization</label>
              <input required placeholder="Cardiology" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input required placeholder="OPD" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Avg Consultation Time (min)</label>
            <input type="number" min="1" value={form.avgConsultationTime} onChange={(e) => setForm({ ...form, avgConsultationTime: +e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit">Create Doctor Profile</button>
        </form>
      </div>

      <div className="card">
        <div className="section-title">Existing Doctors</div>
        <table className="queue-table">
          <thead><tr><th>Name</th><th>Specialization</th><th>Department</th><th>Avg Time</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d._id}>
                <td>Dr. {d.userId?.name}</td>
                <td>{d.specialization}</td>
                <td>{d.department}</td>
                <td>{d.avgConsultationTime}m</td>
                <td>
                  <span className={`badge ${d.isAvailable ? "badge-in-progress" : "badge-waiting"}`}>
                    {d.isAvailable ? "Available" : "Busy"}
                  </span>
                </td>
                <td>
                  <button className="btn btn-danger" style={{ padding: "5px 12px", fontSize: "0.8rem" }} onClick={() => deleteDoctor(d._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Patients list ─────────────────────────────────────────────
function Patients() {
  const [patients, setPatients] = useState([]);
  useEffect(() => { api.get("/admin/patients").then((r) => setPatients(r.data)); }, []);

  return (
    <div>
      <div className="page-header"><h1>All Patients</h1><p>Registered patient records</p></div>
      <div className="card">
        <table className="queue-table">
          <thead><tr><th>Name</th><th>Age</th><th>Phone</th><th>Email</th><th>Default Priority</th></tr></thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.age}</td>
                <td>{p.phone}</td>
                <td style={{ color: "var(--text-muted)" }}>{p.email}</td>
                <td><span className={`badge badge-${p.defaultPriority}`}>{p.defaultPriority}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [view, setView] = useState("overview");
  return (
    <div className="layout">
      <Sidebar activeView={view} setView={setView} />
      <main className="main">
        {view === "overview" && <Overview />}
        {view === "queues" && <AllQueues />}
        {view === "doctors" && <ManageDoctors />}
        {view === "patients" && <Patients />}
      </main>
    </div>
  );
}
