// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import QueueDisplayScreen from "./pages/QueueDisplayScreen";
import "./index.css";

// Redirect to role-specific dashboard
const RoleRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === "doctor") return <Navigate to="/doctor" />;
  if (user.role === "admin") return <Navigate to="/admin" />;
  return <Navigate to="/patient" />;
};

// Protected route wrapper
const Protected = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRouter />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/queue/:doctorId" element={<QueueDisplayScreen />} />
          <Route
            path="/patient"
            element={
              <Protected roles={["patient"]}>
                <PatientDashboard />
              </Protected>
            }
          />
          <Route
            path="/doctor"
            element={
              <Protected roles={["doctor"]}>
                <DoctorDashboard />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected roles={["admin"]}>
                <AdminDashboard />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
