// src/pages/QueueDisplayScreen.js
// Public screen — no auth needed. Meant to be displayed on a TV in the waiting room.
// URL: /queue/:doctorId
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import socket from "../utils/socket";

export default function QueueDisplayScreen() {
  const { doctorId } = useParams();
  const [data, setData] = useState({ queue: [], currentPatient: null });
  const [doctor, setDoctor] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Load doctor info
    api.get(`/doctors/${doctorId}`).then((r) => setDoctor(r.data)).catch(() => {});

    // Load queue
    api.get(`/queue/status/${doctorId}`).then((r) => setData(r.data));

    // Subscribe to live updates
    socket.connect();
    socket.emit("join-queue-room", doctorId);
    socket.on("queue-updated", (d) => setData(d));

    // Clock
    const clock = setInterval(() => setTime(new Date()), 1000);

    return () => {
      socket.off("queue-updated");
      socket.disconnect();
      clearInterval(clock);
    };
  }, [doctorId]);

  const styles = {
    page: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", padding: 32, fontFamily: "'DM Sans', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 },
    logo: { fontFamily: "Syne, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "#3b82f6" },
    clock: { fontFamily: "Syne, sans-serif", fontSize: "2rem", fontWeight: 700, color: "#64748b" },
    doctorName: { fontFamily: "Syne, sans-serif", fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
    nowCard: { background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: 16, padding: 32 },
    nowLabel: { fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 2, opacity: 0.8, marginBottom: 12 },
    nowToken: { fontFamily: "Syne, sans-serif", fontSize: "5rem", fontWeight: 800, lineHeight: 1 },
    nowName: { fontSize: "1.2rem", fontWeight: 600, marginTop: 8 },
    queueCard: { background: "#111827", border: "1px solid #1e2d45", borderRadius: 16, padding: 24 },
    queueTitle: { fontFamily: "Syne, sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: 16, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 },
    row: { display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid #1e2d45" },
    pos: { width: 36, height: 36, borderRadius: "50%", background: "#1a2235", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 },
    token: { fontFamily: "Syne, sans-serif", fontSize: "1.5rem", fontWeight: 800, flex: 1 },
    liveDot: { width: 10, height: 10, borderRadius: "50%", background: "#10b981", animation: "pulse 1.5s infinite", display: "inline-block" },
  };

  const priorityColor = { emergency: "#ef4444", elderly: "#f59e0b", normal: "#3b82f6" };

  return (
    <div style={styles.page}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      <div style={styles.header}>
        <div>
          <div style={styles.logo}>MediQueue</div>
          {doctor && (
            <div>
              <div style={styles.doctorName}>Dr. {doctor.userId?.name}</div>
              <div style={{ color: "#64748b" }}>{doctor.specialization} — {doctor.department}</div>
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={styles.clock}>{time.toLocaleTimeString()}</div>
          <div style={{ color: "#64748b", display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
            <span style={styles.liveDot} /> Live
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Now serving */}
        <div style={styles.nowCard}>
          <div style={styles.nowLabel}>Now Serving</div>
          {data.currentPatient ? (
            <>
              <div style={styles.nowToken}>{data.currentPatient.token}</div>
              <div style={styles.nowName}>{data.currentPatient.patient?.name || ""}</div>
            </>
          ) : (
            <div style={{ opacity: 0.7, fontSize: "1.2rem", marginTop: 20 }}>Waiting for next patient…</div>
          )}
        </div>

        {/* Queue list */}
        <div style={styles.queueCard}>
          <div style={styles.queueTitle}>Up Next ({data.queue?.length || 0})</div>
          {!data.queue?.length ? (
            <div style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>Queue is empty ✅</div>
          ) : (
            data.queue.slice(0, 8).map((a, i) => (
              <div key={a._id} style={styles.row}>
                <div style={styles.pos}>{i + 1}</div>
                <div style={styles.token}>{a.token}</div>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: priorityColor[a.priority] }} title={a.priority} />
                <div style={{ color: "#64748b", fontSize: "0.85rem" }}>~{a.predictedWaitTime}m</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
