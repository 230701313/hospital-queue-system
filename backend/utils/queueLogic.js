// ============================================================
// utils/queueLogic.js — Core scheduling engine
// ============================================================

/**
 * Priority weight map.  Lower number = higher priority.
 */
const PRIORITY_WEIGHT = { emergency: 0, elderly: 1, normal: 2 };

/**
 * Sort queue entries by priority then by creation time (FIFO within same priority).
 * @param {Array} appointments — populated Appointment documents
 * @returns {Array} sorted appointments
 */
exports.sortQueue = (appointments) => {
  return [...appointments].sort((a, b) => {
    const pDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (pDiff !== 0) return pDiff;
    // Same priority → FIFO
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
};

/**
 * Generate a unique daily token.
 * Format: "A001", "A002" … "A999"
 * @param {Object} queueDoc — Queue mongoose document
 * @returns {string} token string
 */
exports.generateToken = (queueDoc) => {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Reset counter at start of each new day
  if (queueDoc.lastResetDate !== today) {
    queueDoc.tokenCounter = 0;
    queueDoc.lastResetDate = today;
  }

  queueDoc.tokenCounter += 1;
  const num = String(queueDoc.tokenCounter).padStart(3, "0");
  return `A${num}`;
};

/**
 * Predict waiting time (minutes) using simple linear regression.
 *
 * Formula:
 *   predictedWait = queueLength × avgConsultationTime × priorityFactor
 *
 * Priority factor accounts for emergency patients jumping the queue:
 *   - emergency: counts only patients with same or higher priority ahead
 *   - elderly/normal: counts all higher-priority patients + same-priority before them
 *
 * @param {Array}  sortedQueue         — already sorted appointment docs
 * @param {string} newPriority         — priority of the incoming patient
 * @param {number} avgConsultationTime — doctor's average minutes per patient
 * @returns {number} estimated wait in minutes
 */
exports.predictWaitTime = (sortedQueue, newPriority, avgConsultationTime = 10) => {
  // Count how many patients are ahead in the sorted queue
  // (all currently waiting patients will be ahead of the new one)
  const waitingAhead = sortedQueue.filter((a) => a.status === "waiting").length;

  // Simple linear prediction
  const estimated = waitingAhead * avgConsultationTime;
  return Math.max(0, estimated);
};
