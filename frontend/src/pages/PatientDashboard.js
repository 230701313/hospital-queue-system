// src/pages/PatientDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import socket from "../utils/socket";

// ── Sub-views ────────────────────────────────────────────────

function BookAppointment() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctorId: "", symptoms: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/doctors").then((r) => setDoctors(r.data));
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    try {
      const { data } = await api.post("/appointments/book", form);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (result) return (
    <div>
      <div className="page-header">
        <h1>Appointment Booked! 🎉</h1>
        <p>Your token has been generated</p>
      </div>
      <div className="token-display" style={{ maxWidth: 320 }}>
        <div className="token-number">{result.token}</div>
        <div className="token-label">Your Token Number</div>
      </div>
      <div className="card" style={{ marginTop: 20, maxWidth: 400 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Priority</span>
            <span className={`badge badge-${result.appointment.priority}`}>{result.appointment.priority}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Predicted Wait</span>
            <span className="wait-pill">⏱ ~{result.predictedWaitTime} min</span>
          </div>
        </div>
      </div>
      <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => setResult(null)}>
        Book Another
      </button>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Book Appointment</h1>
        <p>Select a doctor and describe your symptoms</p>
      </div>
      {user.age >= 60 && (
        <div className="alert alert-info">
          👴 As a senior patient (age {user.age}), you'll receive elderly priority in queues.
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card" style={{ maxWidth: 500 }}>
        <form onSubmit={handleBook}>
          <div className="form-group">
            <label>Select Doctor</label>
            <select required value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              <option value="">-- Choose a doctor --</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.userId?.name} — {d.specialization} ({d.department})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Symptoms / Reason</label>
            <textarea
              rows={3} placeholder="Describe your symptoms. Type 'emergency' if urgent."
              value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
            />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Booking…" : "Book Appointment"}
          </button>
        </form>
      </div>
    </div>
  );
}

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/appointments/my").then((r) => {
      setAppointments(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <h1>My Appointments</h1>
        <p>All your booking history</p>
      </div>
      <div className="card">
        {appointments.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
            No appointments yet. Book your first one!
          </p>
        ) : (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Token</th><th>Doctor</th><th>Priority</th>
                <th>Wait (est.)</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td><strong>{a.token}</strong></td>
                  <td>{a.doctor?.userId?.name || "—"}</td>
                  <td><span className={`badge badge-${a.priority}`}>{a.priority}</span></td>
                  <td><span className="wait-pill">⏱ {a.predictedWaitTime}m</span></td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function QueueStatus() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [queueData, setQueueData] = useState(null);
  const [notification, setNotification] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get("/doctors").then((r) => setDoctors(r.data));
  }, []);

  useEffect(() => {
    if (!selectedDoctor) return;
    // Join socket room for this doctor
    socket.connect();
    socket.emit("join-queue-room", selectedDoctor);
    socket.emit("join-patient-room", user._id);

    socket.on("queue-updated", (data) => setQueueData(data));
    socket.on("your-turn", (data) => {
      setNotification(data.message);
      setTimeout(() => setNotification(null), 8000);
    });

    // Initial fetch
    api.get(`/queue/status/${selectedDoctor}`).then((r) => setQueueData(r.data));

    return () => {
      socket.off("queue-updated");
      socket.off("your-turn");
      socket.disconnect();
    };
  }, [selectedDoctor, user._id]);

  return (
    <div>
      {notification && <div className="notification-bar">🔔 {notification}</div>}
      <div className="page-header">
        <h1>Live Queue Status</h1>
        <p>Real-time updates via WebSocket <span className="live-dot" style={{ marginLeft: 6 }} /></p>
      </div>
      <div className="card" style={{ marginBottom: 20, maxWidth: 400 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Select Doctor's Queue</label>
          <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
            <option value="">-- Select Doctor --</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                Dr. {d.userId?.name} — {d.specialization}
              </option>
            ))}
          </select>
        </div>
      </div>

      {queueData && (
        <div>
          {queueData.currentPatient && (
            <div className="card" style={{ marginBottom: 16, borderColor: "var(--success)", borderWidth: 1 }}>
              <div className="section-title">🩺 Now Being Seen</div>
              <strong>{queueData.currentPatient.patient?.name || queueData.currentPatient.token}</strong>
              {" "}<span className="badge badge-in-progress">In Progress</span>
            </div>
          )}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Waiting Queue</div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {queueData.queue?.length || 0} patient(s) waiting
              </span>
            </div>
            {!queueData.queue?.length ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "30px 0" }}>Queue is empty ✅</p>
            ) : (
              <table className="queue-table">
                <thead>
                  <tr><th>#</th><th>Token</th><th>Priority</th><th>Est. Wait</th></tr>
                </thead>
                <tbody>
                  {queueData.queue.map((a, i) => (
                    <tr key={a._id}>
                      <td><span className="position-badge">{i + 1}</span></td>
                      <td><strong>{a.token}</strong></td>
                      <td><span className={`badge badge-${a.priority}`}>{a.priority}</span></td>
                      <td><span className="wait-pill">⏱ ~{a.predictedWaitTime}m</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────
export default function PatientDashboard() {
  const [view, setView] = useState("book");
  return (
    <div className="layout">
      <Sidebar activeView={view} setView={setView} />
      <main className="main">
        {view === "book" && <BookAppointment />}
        {view === "status" && <QueueStatus />}
        {view === "appointments" && <MyAppointments />}
      </main>
    </div>
  );
}
