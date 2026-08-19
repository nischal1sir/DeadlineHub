# ⏱️ DeadlineHub

<p align="center">
  <img src="./src/assets/logo.png" alt="DeadlineHub Logo" width="100" height="100" />
</p>

<h3 align="center">Manage Projects & Tasks with Intelligence</h3>

<p align="center">
  An open-source, full-stack, enterprise-ready project management and deadline tracking platform featuring dual role-based portals (User & Admin/Super Admin), interactive SVG analytics, server-synchronized notifications, and secure HTTP-only cookie authentication.
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Features-Complete-brightgreen" alt="Features" /></a>
  <a href="#-technology-stack"><img src="https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Node.js%20%7C%20Express%20%7C%20Supabase-748469" alt="Stack" /></a>
  <a href="#-open-source--contributing"><img src="https://img.shields.io/badge/PRs-Welcome-blue.svg" alt="PRs Welcome" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" /></a>
</p>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🛠️ Technology Stack](#%EF%B8%8F-technology-stack)
- [🏗️ System Architecture & Folder Structure](#%EF%B8%8F-system-architecture--folder-structure)
- [🚀 Local Development Setup](#-local-development-setup)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Database Setup (Supabase PostgreSQL)](#2-database-setup-supabase-postgresql)
  - [3. Backend Configuration & Run](#3-backend-configuration--run)
  - [4. Frontend Configuration & Run](#4-frontend-configuration--run)
- [🔑 Environment Variables Reference](#-environment-variables-reference)
- [🌐 Production Deployment Guide](#-production-deployment-guide)
  - [Frontend (Vercel / Netlify)](#frontend-vercel--netlify)
  - [Backend (Render / Railway)](#backend-render--railway)
  - [Database (Supabase)](#database-supabase)
- [📘 Additional Guides](#-additional-guides)
- [🤝 Open Source & Contributing](#-open-source--contributing)
- [📜 License & Author](#-license--author)

---

## ✨ Features

### 👤 User Portal
* **Intuitive Dashboard**: Overview of active projects, quick deadline widgets, and an interactive **Due Today** task checklist with optimistic UI updates.
* **Granular Project Explorer**: Multi-level breakdown: `Projects` $\rightarrow$ `Modules` $\rightarrow$ `Tasks` $\rightarrow$ `Subtasks` with progress bars, status updates, and task dialogs.
* **Interactive Views**: 
  * 📅 **Calendar View**: Visual timeline of upcoming project and task deadlines.
  * ⏳ **Timeline View**: Gantt-style project duration mapping.
  * 📊 **Productivity Analytics**: Individual completion metrics and progress stats.
* **Global Pending Tasks**: Centralized pending task hub supporting multi-criteria search, project filtering, sorting, and inline completion.
* **Profile Management**: Live profile editing with custom avatar uploads and a built-in interactive HTML5 Canvas photo cropper.

### 👑 Admin & Super Admin Control Center
* **Role-Based Privilege System**: Strict separation between Standard Admins and Super Admins.
* **User & Admin Management**: Administrative table for managing user roles, status toggles, delegation, and full user activity logs.
* **Platform Analytics & SVG Visualizations**: Dependency-free custom SVG charts showing active users, system error rates, storage usage, and task volume metrics.
* **Audit Trails & Security Auditing**: Real-time activity logs, IP address tracking, device signatures, and session revocation tools.
* **Floating Notification Drawer**: Server-synchronized notification feeds for 7-day deadline warnings and system alerts.
* **Read-Only Privilege Guards**: System settings protected by role guard overlays to prevent unauthorized configuration mutations.

### 🔐 Security & Infrastructure
* **Google OAuth 2.0 Integration**: Single-click Google Sign-In and Registration featuring a 100% serverless client fallback, automatic profile creation, PKCE code exchange, root hash interceptor, and duplicate registration protection.
* **Streamlined Fast Sign-Up**: Simplified registration requiring only First Name, Last Name, Email, and Password (removed mandatory phone number prompt).
* **Dual-Token Authentication**: Short-lived JWT access tokens paired with long-lived `httpOnly` secure refresh cookies for seamless cross-tab persistence.
* **CORS & CSRF Protection**: Strict origin verification and cookie policy configuration for production deployments.


---

## 🛠️ Technology Stack

### **Frontend**
* **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom CSS Design System (Frosted Fern Tokens)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Routing**: [React Router v6](https://reactrouter.com/)

### **Backend API**
* **Runtime**: [Node.js](https://nodejs.org/) (v18+ LTS)
* **Web Framework**: [Express.js](https://expressjs.com/)
* **Security & Auth**: `jsonwebtoken`, `cookie-parser`, `bcryptjs`, `cors`
* **Database Driver**: [@supabase/supabase-js](https://supabase.com/docs/reference/javascript)

### **Database & Cloud Services**
* **Database**: [Supabase PostgreSQL](https://supabase.com/) with Row Level Security (RLS) policies and automated triggers
* **File Storage**: Supabase Storage Buckets (`avatars`, `attachments`)

---

## 🏗️ System Architecture & Folder Structure

```
DeadlineHub/
├── backend/                  # Node.js Express Backend API
│   ├── middleware/           # Auth & Role-Based Security Middleware
│   ├── routes/               # API Endpoints (auth, projects, tasks, admin, upload, etc.)
│   ├── server.js             # Express Server Initialization
│   └── package.json
├── database/                 # SQL Schema & Migrations
│   └── schema.sql            # Core Tables, RLS Policies & Triggers
├── docs/                     # Comprehensive Guides & Documentation
│   ├── GOOGLE_OAUTH_SETUP_GUIDE.md # Complete Google Cloud & Supabase OAuth Guide
│   └── DEPLOYMENT_GUIDE.md   # Full Production Deployment Guide (Vercel + Render + Supabase)
├── src/                      # React TypeScript Frontend
│   ├── assets/               # Branding assets & logos
│   ├── components/           # Reusable UI Primitives & Layout Shells
│   │   ├── layout/           # PublicNavbar, Sidebar, AdminNavbar, AdminLayout
│   │   └── ui/                # Buttons, Inputs, Modals, Badges
│   ├── hooks/                 # Client Auth Hooks (useAuth)
│   ├── lib/                   # API Client & Utility Functions
│   ├── pages/                 # Page Views
│   │   ├── admin/             # Admin Control Center (Dashboard, Logs, Stats, Settings)
│   │   ├── user/               # User Views (Calendar, Timeline, Analytics)
│   │   ├── Login.tsx           # Responsive Dual-Pane Auth Page
│   │   ├── Register.tsx        # Responsive Dual-Pane Signup Page
│   │   ├── Profile.tsx         # Profile & Canvas Photo Cropper
│   │   └── UserDashboard.tsx   # Main User Portal
│   ├── App.tsx                # Root App Router & Auth Guards
│   ├── main.tsx                # React Entrypoint
│   └── index.css               # Frosted Fern Theme Tokens & Utility Classes
├── COMMIT_WORKFLOW.md         # Step-by-Step 25 Commit Workflow Guide
├── README.md                  # Project Open Source Documentation
├── vercel.json                # Vercel Deployment Configuration
└── vite.config.ts             # Vite Configuration
```

---

## 🚀 Local Development Setup

Follow these steps to run **DeadlineHub** on your local environment.

### Prerequisites
* **Node.js** (v18.0.0 or higher) & **npm** (v9.0.0 or higher)
* **Git** installed on your machine
* A free **[Supabase](https://supabase.com/)** account for PostgreSQL database and file storage

---

### 1. Clone Repository

```bash
git clone https://github.com/nischal1sir/DeadlineHub.git
cd DeadlineHub
```

---

### 2. Database Setup (Supabase PostgreSQL)

1. Log in to your **[Supabase Dashboard](https://database.new)** and create a new project.
2. Go to the **SQL Editor** tab in Supabase.
3. Open the [`database/schema.sql`](database/schema.sql) file from this repository, copy its contents, paste them into the Supabase SQL Editor, and click **Run**.
4. Go to **Storage** in Supabase and ensure a public bucket named `avatars` is created.

---

### 🔑 Google OAuth 2.0 Setup (Optional but Recommended)

To enable **"Continue with Google"** authentication for registration and login:

1. Configure **Google Cloud Console** credentials and **Supabase Auth Provider**.
2. Follow our comprehensive step-by-step guide:  
   👉 **[Google OAuth 2.0 & Supabase Integration Guide](docs/GOOGLE_OAUTH_SETUP_GUIDE.md)**

> ⚠️ **Critical for Local Development**: If you use the same Supabase project for local and production, you **must** add localhost URLs to **Supabase Dashboard → Authentication → URL Configuration**:
> - **Site URL**: `http://localhost:5173`
> - **Redirect URLs**: `http://localhost:5173/auth/callback`, `http://127.0.0.1:5173/auth/callback`, `https://your-production-domain.com/auth/callback`
> Without this, Google OAuth will redirect to production even when running locally.

---

### 3. Backend Configuration & Run

1. Navigate into the `backend/` directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in the `backend/` directory based on `.env.example`:
   ```env
   PORT=5000
   JWT_SECRET=your_super_secret_access_jwt_key_here
   JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here
   SUPABASE_URL=https://your-supabase-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   CLIENT_URL=http://localhost:5173
   ```

3. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The Express server will run on `http://localhost:5000`.*

---

### 4. Frontend Configuration & Run

1. Open a new terminal window, navigate to the root directory, and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root based on `.env.example`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   > **Note:** Most database operations go through the Express backend API. The `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are only needed client-side for the Google OAuth serverless fallback flow — they are the public/anon key and are safe to expose in frontend code.

3. **Supabase Dashboard URL Configuration (Required for Google OAuth):**
   Go to **Supabase Dashboard → Authentication → URL Configuration** and add:
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs**: `http://localhost:5173/auth/callback`, `http://127.0.0.1:5173/auth/callback`, `https://your-production-domain.com/auth/callback`

4. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *Open your browser and navigate to `http://localhost:5173`.*

5. **Debugging Auth Issues (Development Only):**
   Open browser DevTools Console (F12) to see detailed OAuth flow logs:
   - `[Register] Google OAuth - Full redirectTo: http://localhost:5173/auth/callback?mode=signup`
   - `[AuthCallback] Current origin: http://localhost:5173`
   - `[AuthCallback] Backend sync successful: your@gmail.com`
   This helps diagnose redirect issues between local and production environments.

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Node Express server listening port | `5000` |
| `JWT_SECRET` | Secret key for signing short-lived access JWT tokens | `random_long_secret_string` |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | `random_long_refresh_secret_string` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS for backend API) | `eyJhbGciOi...` |
| `CLIENT_URL` | Allowed CORS origin URL | `http://localhost:5173` |

### Frontend (`.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Backend Express API base URL | `http://localhost:5000/api` |
| `VITE_SUPABASE_URL` | Supabase project URL (used for the Google OAuth client-side flow) | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public/anon key (safe to expose; used for Google OAuth) | `eyJhbGciOi...` |

> **Note:** All standard database operations (projects, tasks, admin data, etc.) go through the Express backend API — the frontend only talks to Supabase directly for the Google OAuth sign-in flow.

For a complete, step-by-step walkthrough of every environment variable — including exactly where to find each key inside the Supabase dashboard and common setup mistakes — see the **[full Deployment Guide](docs/DEPLOYMENT_GUIDE.md)**.

---

## 🌐 Production Deployment Guide

> 📘 **For the complete walkthrough** — including where to find each Supabase key, a step-by-step Vercel + Render setup, a post-deploy verification checklist, and common mistakes to watch for — see **[`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md)**. The quick version is below.

### Frontend (Vercel / Netlify)
1. Import your GitHub repository to **[Vercel](https://vercel.com/)** or **[Netlify](https://netlify.com/)**.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Add Environment Variables:
   * `VITE_API_URL` = `https://your-backend-service.onrender.com/api`
   * `VITE_SUPABASE_URL` = `https://your-supabase-project.supabase.co`
   * `VITE_SUPABASE_ANON_KEY` = your Supabase anon/public key

### Backend (Render / Railway)
1. Create a new **Web Service** on **[Render](https://render.com/)** or **Railway**.
2. Root Directory: `backend`.
3. Build Command: `npm install`.
4. Start Command: `node server.js`.
5. Add Environment Variables:
   * Set `CLIENT_URL` to your production frontend URL (e.g. `https://deadlinehub.vercel.app`).
   * Set `PORT`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.

### Database (Supabase)
Your Supabase project is already live once created — no separate deploy step is needed. Just make sure your schema (`database/schema.sql`) has been run and your `avatars` storage bucket exists (see [Step 2](#2-database-setup-supabase-postgresql) above).

---

## 🐛 Recent Auth Fixes (v1.1)

See **[`AUTH_FIX_SUMMARY.md`](AUTH_FIX_SUMMARY.md)** for details on:
- Fix for "Email not confirmed" error incorrectly shown on local login
- Google OAuth localhost → production redirect fix
- Required Supabase Dashboard URL Configuration for local + production
- Environment variables for both environments
- Development-only debugging for OAuth flow

---

## 📘 Additional Guides

* **[Google OAuth 2.0 & Supabase Integration Guide](docs/GOOGLE_OAUTH_SETUP_GUIDE.md)** — Full setup for Google Cloud Console credentials and the Supabase Auth provider.
* **[Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** — Complete Vercel + Render + Supabase deployment walkthrough, with sample env values, where to find each Supabase key, and a post-deploy checklist.

---

## 🤝 Open Source & Contributing

We **welcome contributions** from developers all over the world! Whether you're fixing a bug, improving UI responsiveness, adding a new feature, or enhancing documentation, your help is greatly appreciated.

### How to Contribute

1. **Fork the Repository**: Click the **Fork** button at the top right of this repository.
2. **Clone your Fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/DeadlineHub.git
   cd DeadlineHub
   ```
3. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/awesome-new-feature
   ```
4. **Commit your Changes**: Follow [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(ui): add dark mode toggle to navigation header"
   ```
5. **Push to your Fork**:
   ```bash
   git push origin feature/awesome-new-feature
   ```
6. **Submit a Pull Request**: Open a PR against the `main` branch of `nischal1sir/DeadlineHub` with a detailed description of your changes.

### Reporting Issues & Bug Fixes
Found a bug or have a feature suggestion? Please open an **[Issue](https://github.com/nischal1sir/DeadlineHub/issues)** with detailed reproduction steps.

---

## 📜 License & Author

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

Developed by **[Nischal Rai](https://github.com/nischal1sir)**.

<p align="center">
  ⭐ If you find DeadlineHub useful, please consider giving this repository a star on GitHub! ⭐
</p>
