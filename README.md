# 🏥 MediQueue — Smart Hospital Queue Management System

## Complete Setup & Deployment Guide

---

## 📁 Project Structure

```
hospital-queue/
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js        # Register, Login, GetMe
│   │   ├── appointment.controller.js # Book, List, Queue
│   │   ├── queue.controller.js       # CallNext, Complete, Override
│   │   ├── doctor.controller.js      # CRUD doctors
│   │   └── admin.controller.js       # Overview, AllQueues, Patients
│   ├── models/
│   │   ├── Patient.js                # User/Patient schema + password hash
│   │   ├── Doctor.js                 # Doctor profile schema
│   │   ├── Appointment.js            # Appointment + token schema
│   │   └── Queue.js                  # Queue snapshot per doctor
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── appointment.routes.js
│   │   ├── queue.routes.js
│   │   ├── doctor.routes.js
│   │   └── admin.routes.js
│   ├── middleware/
│   │   └── auth.middleware.js        # JWT protect + role restrict
│   ├── utils/
│   │   ├── queueLogic.js             # Priority sort, token gen, ML prediction
│   │   └── socket.js                 # Socket.io room management
│   ├── server.js                     # Entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js        # Global auth state
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── PatientDashboard.js   # Book, Status, History
    │   │   ├── DoctorDashboard.js    # Live queue, Call Next, Complete
    │   │   ├── AdminDashboard.js     # Overview, Queues, Doctors, Patients
    │   │   └── QueueDisplayScreen.js # Public TV display
    │   ├── components/
    │   │   └── Sidebar.js
    │   ├── utils/
    │   │   ├── api.js                # Axios instance with JWT
    │   │   └── socket.js             # Socket.io singleton
    │   ├── App.js                    # Routes + role guards
    │   ├── index.js
    │   └── index.css                 # Full design system
    ├── package.json
    └── .env.example
```

---

## 🚀 Running Locally

### Step 1 — MongoDB Atlas Setup
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) → Create a free account
2. Create a new **Cluster** (free M0 tier)
3. Click **Connect** → **Drivers** → copy the connection string
4. Replace `<password>` with your DB user password
5. Add `0.0.0.0/0` to your IP Access List (Network Access tab)

### Step 2 — Backend Setup

```bash
cd hospital-queue/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and fill in your values:
#   MONGO_URI=mongodb+srv://...
#   JWT_SECRET=any_long_random_string
#   CLIENT_URL=http://localhost:3000
#   PORT=5000

# Start development server
npm run dev
# → Server running on http://localhost:5000
```

### Step 3 — Frontend Setup

```bash
cd hospital-queue/frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env:
#   REACT_APP_API_URL=http://localhost:5000/api
#   REACT_APP_SOCKET_URL=http://localhost:5000

# Start React dev server
npm start
# → App running on http://localhost:3000
```

### Step 4 — Seed an Admin Account

Register normally at `/register`, then manually update the role in MongoDB Atlas:
1. Go to Atlas → Browse Collections → `patients` collection
2. Find your user → Edit → change `"role"` to `"admin"`

Or use MongoDB Compass with the same URI.

---

## 🌐 Cloud Deployment

### Deploy Backend → Render

1. Push your code to a GitHub repository
2. Go to [https://render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
5. Add Environment Variables (Render Dashboard → Environment):
   ```
   MONGO_URI        = mongodb+srv://your_atlas_connection_string
   JWT_SECRET       = your_production_jwt_secret_here
   CLIENT_URL       = https://your-app.vercel.app    ← fill after step below
   PORT             = 5000
   ```
6. Click **Create Web Service** → wait for deploy
7. Copy your Render URL: `https://hospital-queue-xxx.onrender.com`

### Deploy Frontend → Vercel

1. Go to [https://vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
4. Add Environment Variables:
   ```
   REACT_APP_API_URL    = https://hospital-queue-xxx.onrender.com/api
   REACT_APP_SOCKET_URL = https://hospital-queue-xxx.onrender.com
   ```
5. Click **Deploy**
6. Copy your Vercel URL and go back to **Render → Environment Variables** → update `CLIENT_URL`

---

## 🔌 REST API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/doctors` | None | List all doctors |
| POST | `/api/doctors` | Admin | Create doctor profile |
| DELETE | `/api/doctors/:id` | Admin | Delete doctor |
| POST | `/api/appointments/book` | JWT | Book appointment, get token |
| GET | `/api/appointments/my` | JWT | My appointments |
| GET | `/api/appointments/queue/:doctorId` | JWT | Doctor's sorted queue |
| GET | `/api/queue/status/:doctorId` | None | Live queue status (public) |
| POST | `/api/queue/next` | Doctor | Call next patient |
| POST | `/api/queue/complete` | Doctor | Mark consultation complete |
| POST | `/api/queue/override` | Admin | Override patient priority |
| GET | `/api/admin/overview` | Admin | System stats |
| GET | `/api/admin/queues` | Admin | All doctor queues |
| GET | `/api/admin/patients` | Admin | All patients |

---

## ⚡ Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-queue-room` | Client → Server | Subscribe to a doctor's queue (sends doctorId) |
| `join-patient-room` | Client → Server | Subscribe to personal notifications (sends userId) |
| `queue-updated` | Server → Client | Queue changed — payload: `{ queue, currentPatient }` |
| `your-turn` | Server → Client | Sent to patient when doctor calls them |

---

## 🧠 Priority Queue Logic

Patients are sorted using a **weighted priority + FIFO** algorithm:

```
Emergency  → weight 0  (always first)
Elderly    → weight 1  (age ≥ 60, auto-detected at registration)
Normal     → weight 2  (default, FIFO within same weight)
```

Waiting time is predicted using a simple linear regression:
```
predictedWait = patientsAhead × avgConsultationTime (minutes)
```

`avgConsultationTime` is dynamically updated per doctor using a rolling average:
```
newAvg = oldAvg × 0.8 + actualDuration × 0.2
```

---

## 📺 Public Queue Display

The URL `/queue/:doctorId` is a public, no-auth waiting room TV screen.
It shows the current patient token + upcoming queue in real time.

Get a doctor's ID from the `/api/doctors` endpoint.

---

## 🔑 .env Files Summary

**backend/.env**
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/hospital_queue
JWT_SECRET=change_this_to_something_long_and_random
CLIENT_URL=http://localhost:3000
PORT=5000
```

**frontend/.env**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```
