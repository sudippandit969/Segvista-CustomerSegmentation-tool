# ⚡ Segvista — Customer Segmentation & Retention Analytics Platform

**Segvista** is an AI-powered customer intelligence platform designed to transform raw customer transaction datasets into actionable business retention insights. Built with **FastAPI**, **scikit-learn**, **Pandas**, **React**, and **Recharts**, Segvista performs automated **RFM (Recency, Frequency, Monetary) analysis** and **K-Means machine learning clustering** to identify high-value VIPs, churn-risk accounts, and revenue trends.

## Live Deployment

- **Live application:** [https://segvista.vercel.app](https://segvista.vercel.app)

---

## ✨ Features

- 🎯 **Automated K-Means Clustering:** Groups customers into 5 behavioral segments (`VIP`, `Loyal`, `Regular`, `At Risk`, `Lost`).
- 📊 **Executive Dashboard KPIs:** Real-time metrics for Total Revenue, Active Customers, Average Customer Lifetime Value (LTV), and Churn Rate.
- 🛡️ **Graceful Partial Data Processing:** Flexible column aliasing parses any CSV layout and computes all possible analyses even with missing fields.
- 🔒 **Multi-Tenant User Isolation:** Per-user authentication (JWT) ensures users only see and analyze their own uploaded data.
- 💾 **File-Backed Local Persistence:** Accounts and dataset analyses persist on disk to survive server restarts.
- 📥 **Filtered Customer Directory & Export:** View, filter by segment, and export segmented customer lists to CSV.
- 🎨 **Modern Mid-Tone Glassmorphism Interface:** Centered navigation, responsive charts, and toast notifications.

---

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Data Science & ML:** Pandas, NumPy, scikit-learn (`StandardScaler`, `KMeans`)
- **Server:** Uvicorn
- **Authentication:** Custom JWT token handler with SHA-256 hashing

### Frontend
- **Framework:** React 18 (Vite)
- **Routing:** React Router DOM v6
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Axios

### Database & Analytics
- **Storage:** Local JSON & CSV file-backed database layer (`backend/db/`)
- **SQL Analytics:** 25 Production-grade advanced SQL queries (`sql/advanced_queries.sql`)

---

## 📁 Repository Structure

```
Segvista/
├── backend/
│   ├── main.py              # FastAPI application, ML pipeline & auth endpoints
│   ├── requirements.txt     # Python backend dependencies
│   └── db/                  # Persistent local storage (users.json & user_data/)
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, etc.
│   │   ├── pages/           # Home, Dashboard, Customers, Login, Register, etc.
│   │   ├── App.jsx          # Router & layout entry point
│   │   ├── App.css          # Layout & navbar CSS
│   │   └── index.css        # Global CSS design tokens
│   └── public/              # Background images & static assets
├── sql/
│   └── advanced_queries.sql # 25 Advanced SQL scripts for retention & cohort analysis
├── data/
│   ├── customer_transactions.csv # Sample transaction dataset
│   └── generate_dataset.py       # Dataset generator script
├── interview-prep.md        # Comprehensive interview guide, calculations & Q&A
└── README.md                # Project documentation
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Segvista.git
cd Segvista
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows Powershell
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend
uvicorn main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`. API documentation is available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
# Open a new terminal
cd frontend

# Install node dependencies
npm install

# Run Vite dev server
npm run dev
```
Frontend will run at `http://localhost:5173` (or `http://localhost:5174`).

---

## 📊 Sample CSV Format

Segvista automatically detects column names flexibly. You can upload CSVs with standard headers like:

| CustomerID | Sales | Purchase Date | Recency | Frequency | Monetary | Customer Lifetime Value | Churn | Payment Mode |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CUST_001` | 450.00 | `2023-10-15` | 12 | 5 | 1250.00 | 2500.00 | 0 | `Credit Card` |
| `CUST_002` | 800.00 | `2023-08-01` | 85 | 2 | 800.00 | 1100.00 | 1 | `PayPal` |

*Note: Column name variations like `customer_id`, `order_date`, `CLV`, `LTV`, `amount`, and boolean Churn values (`Yes`/`No`/`1`/`0`) are automatically handled.*

---

## 🌐 Deployment Instructions

For step-by-step production deployment guides across cloud providers:

- 📖 **[Read the Full Deployment Guide (deployment-guide.md)](file:///d:/All%20Projects/Segvista/deployment-guide.md)**
- 🎯 **[Read the Interview Preparation & Technical Guide (interview-prep.md)](file:///d:/All%20Projects/Segvista/interview-prep.md)**

### Quick Overview:
1. **Backend Deployment (Render / Railway):**
   - Environment: Python 3.11
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Frontend Deployment (Vercel / Netlify):**
   - Environment: Node.js 18+
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

---

## 📄 License & Credits

Developed with ❤️ for Customer Analytics & ML Segmentation. Created by **Sudip**.
