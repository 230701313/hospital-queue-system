// ============================================================
// utils/socket.js — Socket.io event management
// ============================================================

let ioInstance = null;

/**
 * Initialise Socket.io listeners.
 * Called once from server.js after io is created.
 */
exports.initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Patient/Doctor joins a "room" identified by doctorId
    // so broadcasts are scoped to a specific doctor's queue
    socket.on("join-queue-room", (doctorId) => {
      socket.join(`queue-${doctorId}`);
      console.log(`   ↳ Joined room queue-${doctorId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit a queue update to all clients watching a doctor's queue.
 * @param {string} doctorId
 * @param {Object} payload  — { queue, currentPatient, message }
 */
exports.emitQueueUpdate = (doctorId, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`queue-${doctorId}`).emit("queue-updated", payload);
};

/**
 * Notify a specific patient that their turn has arrived.
 * Clients subscribe with their userId as a personal room.
 * @param {string} patientId
 * @param {Object} payload
 */
exports.emitPatientNotification = (patientId, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`patient-${patientId}`).emit("your-turn", payload);
};

/**
 * Let a patient join their personal notification room.
 * Called from frontend: socket.emit("join-patient-room", userId)
 * Wired in initSocket below.
 */
exports.initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on("join-queue-room", (doctorId) => {
      socket.join(`queue-${doctorId}`);
    });

    socket.on("join-patient-room", (patientId) => {
      socket.join(`patient-${patientId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
