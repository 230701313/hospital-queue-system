// src/pages/DoctorDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import socket from "../utils/socket";

function DoctorQueue({ onCallNext }) {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load doctor profile then queue
  useEffect(() => {
    api.get("/doctors").then((r) => {
      const me = r.data.find((d) => d.userId?._id === user._id || d.userId?.email === user.email);
      if (me) {
        setDoctorId(me._id);
        api.get(`/queue/status/${me._id}`).then((res) => {
          setQueue(res.data.queue || []);
          setCurrent(res.data.currentPatient || null);
          setLoading(false);
        });

        // Real-time updates
        socket.connect();
        socket.emit("join-queue-room", me._id);
        socket.on("queue-updated", (data) => {
          setQueue(data.queue || []);
          setCurrent(data.currentPatient || null);
        });
      } else {
        setLoading(false);
      }
    });
    return () => { socket.off("queue-updated"); socket.disconnect(); };
  }, [user]);

  const callNext = async () => {
    try {
      await api.post("/queue/next");
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const complete = async () => {
    if (!current) return;
    try {
      await api.post("/queue/complete", { appointmentId: current._id });
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading queue…</p>;

  if (!doctorId) return (
    <div className="alert alert-error">
      No doctor profile found for your account. Please contact admin to create your doctor profile.
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>My Queue</h1>
        <p>Manage your patient queue in real time <span className="live-dot" style={{ marginLeft: 6 }} /></p>
      </div>

      {/* Current patient */}
      <div className="card" style={{ marginBottom: 20, borderColor: current ? "var(--success)" : "var(--border)" }}>
        <div className="section-title">🩺 Current Patient</div>
        {current ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: "1.4rem", fontWeight: 700 }}>
                {current.patient?.name}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                Token: <strong>{current.token}</strong> &nbsp;|&nbsp; Age: {current.patient?.age}
                &nbsp;|&nbsp; <span className={`badge badge-${current.priority}`}>{current.priority}</span>
              </div>
            </div>
            <button className="btn btn-success" onClick={complete}>
              ✅ Complete
            </button>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No patient in consultation</p>
        )}
      </div>

      {/* Call next */}
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={callNext} disabled={queue.length === 0}>
          📢 Call Next Patient ({queue.length} waiting)
        </button>
      </div>

      {/* Queue list */}
      <div className="card">
        <div className="section-title">Waiting Queue</div>
        {queue.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "30px 0" }}>
            Queue is empty 🎉
          </p>
        ) : (
          <table className="queue-table">
            <thead>
              <tr><th>#</th><th>Token</th><th>Patient</th><th>Age</th><th>Priority</th><th>Est. Wait</th></tr>
            </thead>
            <tbody>
              {queue.map((a, i) => (
                <tr key={a._id}>
                  <td><span className="position-badge">{i + 1}</span></td>
                  <td><strong>{a.token}</strong></td>
                  <td>{a.patient?.name}</td>
                  <td>{a.patient?.age}</td>
                  <td><span className={`badge badge-${a.priority}`}>{a.priority}</span></td>
                  <td><span className="wait-pill">⏱ ~{a.predictedWaitTime}m</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const [view, setView] = useState("queue");
  return (
    <div className="layout">
      <Sidebar activeView={view} setView={setView} />
      <main className="main">
        <DoctorQueue />
      </main>
    </div>
  );
}
