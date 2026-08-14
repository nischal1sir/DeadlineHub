# 🌐 Production Deployment Guide

This guide walks through deploying **DeadlineHub** to production — frontend on **Vercel**, backend on **Render**, database on **Supabase**. Follow it in order the first time you deploy.

> ⚠️ **Never commit real API keys, secrets, or `.env` files to GitHub.** All values below are samples — enter your real values directly into Render's and Vercel's dashboards, never into code.

---

## Overview: What Goes Where

```
┌─────────────┐      HTTPS       ┌──────────────┐      Service Role Key    ┌────────────┐
│   Vercel     │ ───────────────▶ │    Render     │ ────────────────────────▶ │  Supabase   │
│  (Frontend)  │  VITE_API_URL    │  (Backend)    │  SUPABASE_SERVICE_ROLE  │  (Database) │
└─────────────┘                  └──────────────┘                          └────────────┘
```

- **Frontend (Vercel)** — serves the React app, talks to the backend API, and also talks to Supabase directly *only* for Google OAuth sign-in (the "serverless client fallback" feature).
- **Backend (Render)** — the Express API that handles projects, tasks, admin routes, etc., using the Supabase service role key.
- **Database (Supabase)** — hosts PostgreSQL, Auth, and Storage.

---

## Step 1 — Get Your Supabase Keys

Before deploying anywhere, grab your keys from Supabase first.

1. Go to [supabase.com](https://supabase.com) → open your project.
2. In the left sidebar, go to **Settings → API**.

You'll see a few different keys here — this is the single most common point of confusion, so read carefully:

| What you see in Supabase | Used in | Goes into | Safe to expose publicly? |
|---|---|---|---|
| **Project URL** | Backend & Frontend | `SUPABASE_URL` / `VITE_SUPABASE_URL` | ✅ Yes |
| **anon / public key** (starts `eyJ...`, or newer `sb_publishable_...`) | Frontend only (Google OAuth) | `VITE_SUPABASE_ANON_KEY` | ✅ Yes — safe in browser code |
| **service_role key** (under **Settings → API → Secret keys**, or the Legacy tab) — starts `eyJ...`, or newer `sb_secret_...` | Backend only | `SUPABASE_SERVICE_ROLE_KEY` | ❌ **Never** — bypasses all security rules |

> 🔴 **Confusion point:** The `anon` key and `service_role` key are both long random-looking strings and easy to mix up. The **service_role** key is the dangerous one. It must only ever live in Render's environment — never in frontend code, never in a public repo.

> 🟡 **Note:** Supabase now offers newer key formats (`sb_publishable_...` / `sb_secret_...`) alongside the older `eyJ...` JWT-style keys. Both work — just make sure the public one goes to the frontend and the secret one goes to the backend.

---

## Step 2 — Deploy the Database (Supabase)

If you haven't already set up your Supabase project:

1. Log in to the [Supabase Dashboard](https://database.new) and create a new project.
2. Open the **SQL Editor** tab.
3. Copy the contents of `database/schema.sql` from this repo and run it in the SQL Editor.
4. Go to **Storage** and confirm a public bucket named `avatars` exists.
5. If using Google Sign-In, follow [`docs/GOOGLE_OAUTH_SETUP_GUIDE.md`](./GOOGLE_OAUTH_SETUP_GUIDE.md) to configure the Auth provider.

Supabase itself doesn't need a separate "deploy" step — it's already live once your project is created.

---

## Step 3 — Deploy the Backend (Render)

1. Push your code to GitHub if you haven't already.
2. Go to [Render](https://render.com/) → **New → Web Service** → connect your GitHub repo.
3. Configure the service:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Under the **Environment** tab, add these variables:

```dotenv
PORT=5000
JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_a_different_long_random_secret
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace_with_your_service_role_key
CLIENT_URL=https://your-frontend-app.vercel.app
```

5. Click **Create Web Service**. Render will build and deploy automatically.
6. Once live, note your backend's URL — it'll look like `https://your-app-name.onrender.com`.

> 🔴 **Confusion point:** `CLIENT_URL` must exactly match your live Vercel domain — including `https://`, with **no trailing slash**. This is used for CORS; if it's wrong, your frontend requests will be silently blocked even though the backend is running fine.

> 🟡 **Tip:** You won't have your final Vercel URL until you deploy the frontend in Step 4. That's fine — deploy the backend first with a placeholder `CLIENT_URL`, then come back and update it once you have the real Vercel URL.

---

## Step 4 — Deploy the Frontend (Vercel)

1. Go to [Vercel](https://vercel.com/) → **Add New → Project** → import your GitHub repo.
2. Framework Preset: **Vite** (should be auto-detected).
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Under **Settings → Environment Variables**, add:

```dotenv
VITE_API_URL=https://your-backend-app.onrender.com/api
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=replace_with_your_anon_key
```

6. Make sure each variable is enabled for the **Production** environment (Vercel asks you to pick scopes when adding each one).
7. Click **Deploy**.

> 🔴 **Confusion point #1:** Don't reuse your local `VITE_API_URL=http://localhost:5000/api` value here. On the deployed site, "localhost" refers to each visitor's own computer, not your server — it will always fail. Always set the production value directly in Vercel's dashboard.

> 🔴 **Confusion point #2:** Don't forget the `/api` at the end of `VITE_API_URL` — the Express routes are mounted under `/api`, so leaving it off causes every request to silently 404.

> 🔴 **Confusion point #3:** Vite only exposes variables prefixed with `VITE_` to frontend code. A variable named `SUPABASE_URL` (no prefix) will be `undefined` in the browser — double check the prefix matches exactly.

---

## Step 5 — Connect the Loop (Go Back and Fix `CLIENT_URL`)

Now that you have your real Vercel URL:

1. Go back to **Render → your backend service → Environment**.
2. Update `CLIENT_URL` to your actual deployed Vercel URL (e.g. `https://deadlinehub.vercel.app`).
3. Save — Render will redeploy automatically.

> 🟡 **Why this matters:** Without this final step, your backend's CORS policy still only trusts your placeholder/localhost URL, so it will reject every request from your live frontend even though both services are technically running.

---

## Step 6 — Redeploy After Any Environment Variable Change

This trips people up often: **changing an environment variable does not automatically apply to an already-running deployment.**

- **On Vercel:** Go to Deployments → click the **⋯** menu on the latest deployment → **Redeploy**. Or push a new commit.
- **On Render:** Saving environment variable changes usually triggers an automatic redeploy — but if not, use the **Manual Deploy** button.

---

## Step 7 — Verification Checklist

Go through this list after both are deployed:

- [ ] Visiting your Render backend URL directly loads *something* (even a 404 on `/` is fine — it means the server is alive)
- [ ] On your live Vercel site, DevTools → **Network tab** shows requests going to your **Render URL**, not `localhost`
- [ ] Those requests include the `/api` prefix and return `200`, not `404`
- [ ] No CORS errors appear in the browser Console
- [ ] `CLIENT_URL` on Render exactly matches your Vercel domain
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only appears in Render's environment — never committed to GitHub, never in frontend code
- [ ] Login, Google Sign-In, and project creation all work end-to-end on the live site

---

## Step 8 — Keep a Safe `.env.example` in the Repo

So future contributors know what's needed without ever seeing real secrets, keep these committed:

**`backend/.env.example`**
```dotenv
PORT=5000
JWT_SECRET=replace_with_your_own_secret
JWT_REFRESH_SECRET=replace_with_your_own_refresh_secret
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace_with_your_service_role_key
CLIENT_URL=http://localhost:5173
```

**`.env.example`** (frontend, project root)
```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=replace_with_your_anon_key
```

And confirm your `.gitignore` includes:
```
.env
.env.local
```

---

## Related Guides

- [`docs/GOOGLE_OAUTH_SETUP_GUIDE.md`](./GOOGLE_OAUTH_SETUP_GUIDE.md) — Google Cloud Console & Supabase Auth provider setup
