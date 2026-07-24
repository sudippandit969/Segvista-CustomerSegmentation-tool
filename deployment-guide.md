# 🚀 Complete Deployment Guide for Segvista

This guide provides step-by-step instructions for deploying **Segvista** to production for free or at low cost using popular cloud platforms (**Render**, **Vercel**, **Railway**, or **Docker**).

---

## 📌 Prerequisites Before Deployment

1. **Git Repository:** Ensure your project is pushed to a public or private repository on **GitHub** or **GitLab**.
2. **Accounts Needed:**
   - [Render Account](https://render.com/) or [Railway Account](https://railway.app/) for the Python FastAPI backend.
   - [Vercel Account](https://vercel.com/) or [Netlify Account](https://netlify.com/) for the React Vite frontend.

---

## 🌐 Method 1: Split Deployment (Recommended: Render + Vercel)

This is the easiest and most reliable free cloud deployment strategy.

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Vercel / Netlify            │       │      Render Web Service         │
│  React Frontend (Vite Static)   │ ────► │  FastAPI Python Backend (API)   │
│  https://segvista.vercel.app    │       │  https://segvista-api.onrender  │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

---

### Step 1: Deploy Backend to Render

1. Log into **[Render Dashboard](https://dashboard.render.com/)** and click **New +** ➔ **Web Service**.
2. Connect your GitHub repository containing `Segvista`.
3. Configure the Web Service settings:
   - **Name:** `segvista-backend` (or your choice)
   - **Region:** Choose the region closest to your users.
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`

4. Add **Environment Variables** in Render Dashboard:
   - `SECRET_KEY` = `your_super_secret_jwt_key_here_2026`
   - `PYTHON_VERSION` = `3.11.0`

5. Click **Create Web Service**. Wait 2-3 minutes for deployment to finish.
6. **Copy your Backend URL** (e.g., `https://segvista-backend.onrender.com`).

---

### Step 2: Update Frontend API Base URL

In your React frontend, update the API requests to point to your live Render backend URL instead of `localhost:8000`.

Create an `.env.production` file in your `frontend/` directory:

```env
VITE_API_URL=https://segvista-backend.onrender.com
```

In `frontend/src/pages/Dashboard.jsx`, `Login.jsx`, `Register.jsx`, and `Customers.jsx`, update Axios calls to use `import.meta.env.VITE_API_URL`:

```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
axios.post(`${API_BASE}/api/login`, ...);
```

---

### Step 3: Deploy Frontend to Vercel

1. Log into **[Vercel Dashboard](https://vercel.com/dashboard)** and click **Add New...** ➔ **Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Add **Environment Variables** in Vercel:
   - `VITE_API_URL` = `https://segvista-backend.onrender.com`

5. Click **Deploy**. Vercel will build your static app and provide a live URL (e.g. `https://segvista.vercel.app`).

---

## 🚂 Method 2: Single Platform Deployment on Railway

Railway allows hosting both backend and frontend under a single project with automatic database volume storage.

### 1. Backend Service on Railway
- Create a new Railway project ➔ **Deploy from GitHub repo**.
- Set **Root Directory** to `backend`.
- Railway automatically detects `requirements.txt`.
- Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Under **Variables**, add `SECRET_KEY`.
- Under **Settings ➔ Volume**, attach a persistent storage volume mounted at `/app/db` so customer data is never wiped.

### 2. Frontend Service on Railway
- Add a second service in the same project ➔ **Deploy from GitHub repo**.
- Set **Root Directory** to `frontend`.
- Build Command: `npm run build`
- Output Directory: `dist`

---

## 🐳 Method 3: Single Container Deployment (Docker)

If you prefer deploying a single containerized application to AWS ECS, DigitalOcean App Platform, or GCP Cloud Run:

### 1. Root Dockerfile

Create a file named `Dockerfile` in the root of your project:

```dockerfile
# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve Backend & Static Frontend
FROM python:3.11-slim
WORKDIR /app

# Install system & python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./backend

# Copy built static frontend files into backend static folder
COPY --from=frontend-builder /app/frontend/dist ./backend/static

# Create persistent db directory
RUN mkdir -p /app/backend/db

EXPOSE 8000

ENV PORT=8000
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
```

### 2. Build & Run Docker Image Locally to Test
```bash
# Build Docker image
docker build -t segvista:latest .

# Run Docker container
docker run -p 8000:8000 segvista:latest
```
Access the containerized app at `http://localhost:8000`.

---

## 🔒 Security & CORS Production Checklist

When serving in production:

1. **Update CORS Configuration in `backend/main.py`:**
   Replace `allow_origins=["*"]` with your specific frontend domain:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "https://segvista.vercel.app",
           "http://localhost:5173"
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Environment Variable Secret Keys:**
   Never hardcode `SECRET_KEY` in `main.py` for production. Read it from `os.environ`:
   ```python
   SECRET_KEY = os.getenv("SECRET_KEY", "fallback_local_secret_key")
   ```

---

## 📊 Deployment Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **CORS Error in Browser** | Backend `allow_origins` doesn't include the frontend domain. | Add your frontend Vercel/Netlify URL to CORS `allow_origins` in `backend/main.py`. |
| **500 Error on Cold Start** | Render free tier spins down after 15 mins of inactivity. | Wait 30 seconds for backend to wake up, or add a ping cron job. |
| **Data disappears on restart** | Disk is non-persistent in default container hosts. | Attach a persistent disk volume to `/app/db` on Railway/Render. |
| **404 on Page Refresh** | Single Page App (SPA) routing fallback missing on frontend host. | Add a `vercel.json` or `_redirects` file for SPA routing (`/* -> /index.html`). |
