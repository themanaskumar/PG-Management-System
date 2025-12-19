# PG Management System

> A simple PG (paying guest) management web application — Node/Express backend with MongoDB, and a React + Vite frontend.

Repository: https://github.com/themanaskumar/PG-Management-System.git

## Overview

This project provides a minimal management system for a PG: tenant onboarding, room management, monthly bill generation, complaints, and online payments via Razorpay. It includes:

- REST API backend built with Express and Mongoose ([backend/server.js](backend/server.js)).
- React frontend scaffolded with Vite located in the `client` folder.
- Image/file uploads handled via Cloudinary.
- Email notifications via Gmail SMTP (nodemailer).
- Scheduled monthly bill generation using `node-cron`.

## Key Features

- Admin: create tenants, seed rooms, view rooms, manage tenant history.
- Tenant: view dashboard, pay bills (Razorpay integration), raise complaints.
- Automatic monthly bill generation and rent history recording.

## Repo Structure (important files)

- backend/
  - server.js — Express app entrypoint
  - config/db.js — MongoDB connection helper
  - controllers/ — route handlers (e.g., `adminController.js`)
  - middleware/ — auth and upload middlewares
  - models/ — Mongoose models (`User.js`, `Room.js`, `Bill.js`, etc.)
  - routes/ — Express routes mounted under `/api/*`
  - utils/ — helpers: `sendEmail.js`, `generateToken.js`, `billGenerator.js`
- client/ — React app (Vite)
  - src/Pages — pages like `AdminDashboard.jsx`, `TenantDashboard.jsx`
  - src/components — shared UI components

## Environment Variables

Create a `.env` file in `backend/` with the following keys (example):

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/pg-management
JWT_SECRET=your_jwt_secret_here

# Gmail SMTP (used by nodemailer)
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=app-specific-password-or-smtp-password

# Cloudinary (uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay (payments)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

NODE_ENV=development
```

Notes:
- `EMAIL_PASS` may need an app password if using Gmail with 2FA.
- If you do not plan to use payments, Razorpay vars can be left unset but payment endpoints will fail.

## Quick Start

Prerequisites:
- Node.js (v16+ recommended)
- MongoDB (local or cloud)

1) Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../client
npm install
```

2) Start backend and frontend (development)

```bash
# In one terminal: start backend
cd backend
# Either run with node or use nodemon if installed globally
node server.js

# In another terminal: start frontend
cd client
npm run dev
```

If you prefer automatic restarts for the backend, install `nodemon` globally or add a script in `backend/package.json`:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

After both servers are running:
- API root: http://localhost:5000/
- Frontend (Vite) will display host/port in the terminal (commonly http://localhost:5173)

## Important Endpoints (examples)

- POST `/api/auth/login` — authenticate user
- POST `/api/admin/tenants` — create tenant (admin)
- GET `/api/admin/rooms` — list rooms
- POST `/api/payment/create-order` — create Razorpay order (tenant)
- POST `/api/payment/verify` — verify payment signature

Refer to `backend/routes` for complete routes and controllers.

## Database Models (high level)

- `User` — tenants and admins (password hashed). See `backend/models/User.js`.
- `Room` — `roomNo`, `status`, `currentTenant`.
- `Bill` — monthly bills with `amount`, `month`, `year`, `status`.
- `Rent` — rent payment history.
- `Complaint` — tenant complaints.

## Files to Inspect for Customization

- [backend/server.js](backend/server.js) — app bootstrapping and route mounts
- [backend/config/db.js](backend/config/db.js) — DB connection string
- [backend/middleware/uploadMiddleware.js](backend/middleware/uploadMiddleware.js) — Cloudinary setup
- [backend/utils/sendEmail.js](backend/utils/sendEmail.js) — email sender (Gmail)
- [client/src/Pages/TenantDashboard.jsx](client/src/Pages/TenantDashboard.jsx) — tenant UI

## Deployment Notes

- For production, set `NODE_ENV=production`, use a production-ready process manager (PM2 or systemd) and host MongoDB in a managed service (MongoDB Atlas).
- Secure environment variables using your cloud provider's secrets manager.
- When deploying the frontend, build with `npm run build` and serve the static files (or host on Netlify/Vercel).

## Suggestions / TODOs

- Add backend `start`/`dev` scripts to `backend/package.json` for convenience.
- Add a `.env.example` file with placeholder keys.
- Add API documentation (Swagger/OpenAPI) for the routes.

## License

This repository does not include a license file. Add one if you want to open-source the project.

---
Created README to index and document the PG Management System. For any edits or additions, tell me which area you'd like expanded.
