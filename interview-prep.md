# 🎯 Segvista — Interview Preparation & Technical Deep-Dive

Welcome to the **Segvista Interview Preparation Guide**. This document contains comprehensive technical explanations, analytical calculations, SQL queries, machine learning logic, core architecture breakdowns, and top interview questions & answers to help you explain Segvista in any software engineering, data engineering, or data analytics interview.

---

## 📌 1. Project Summary for Interviews (Elevator Pitch)

> **"Segvista is an end-to-end AI-powered Customer Intelligence and Segmentation platform. It allows businesses to upload raw customer transaction CSV datasets and automatically performs RFM (Recency, Frequency, Monetary) analysis, K-Means Clustering (scikit-learn), Churn Rate calculation, and Customer Lifetime Value (LTV) estimation. It delivers real-time executive dashboard KPIs, segment distributions, churn risk alerts, customer directory management, and CSV exports — all built with FastAPI (Python) on the backend and React + Recharts on the frontend."**

---

## 🧮 2. Key Analytical Calculations & Formulas Used

### A. RFM Metrics (Recency, Frequency, Monetary)
* **Recency ($R$):** Days elapsed since the customer's last purchase transaction date relative to the dataset max date or current date.
  $$\text{Recency} = \text{Max Date} - \text{Last Purchase Date}$$
* **Frequency ($F$):** Total count of unique purchase orders/transactions made by the customer.
  $$\text{Frequency} = \text{Count}(\text{OrderID})$$
* **Monetary ($M$):** Total financial spend accumulated by the customer across all transactions.
  $$\text{Monetary} = \sum \text{Sales}$$

### B. Machine Learning Segmentation (K-Means Clustering)
1. **Feature Matrix Selection:** $X = [\text{Recency}, \text{Frequency}, \text{Monetary}]$
2. **Standardization (StandardScaler):** Normalizes features so distance metrics aren't dominated by monetary scale ($M \gg F$).
   $$z = \frac{x - \mu}{\sigma}$$
3. **K-Means Clustering Algorithm ($k=5$):** Minimizes Within-Cluster Sum of Squares (WCSS / Inertia):
   $$\text{WCSS} = \sum_{i=1}^{k} \sum_{x \in S_i} ||x - \mu_i||^2$$
4. **Segment Mapping:**
   - `0`: **Lost** (High Recency, Low Frequency/Monetary)
   - `1`: **VIP** (Low Recency, High Frequency, High Monetary)
   - `2`: **Regular** (Moderate Recency & Frequency)
   - `3`: **Loyal** (High Frequency, Steady Spend)
   - `4`: **At Risk** (High Spend in Past, High Recency/Inactivity)

### C. Executive Dashboard KPIs
* **Total Revenue:** $\sum \text{Sales}$
* **Active Customers:** $\text{Count(Unique CustomerID)}$
* **Average LTV (Customer Lifetime Value):** $\text{Mean}(\text{Customer Lifetime Value})$
* **Churn Rate (%):**
  $$\text{Churn Rate} = \left( \frac{\text{Count of Churned Customers}}{\text{Total Customers}} \right) \times 100$$
  *(Flexible Boolean parser converts `1`/`0`, `Yes`/`No`, `True`/`False` into numeric $1/0$.)*

---

## 📊 3. Core SQL Queries & Analytical Techniques

Segvista includes 25 production-ready SQL analytics scripts located in `sql/advanced_queries.sql`. Here are the core queries and techniques to discuss in interviews:

### 1. Dynamic RFM Segmentation using CTEs & Window Functions (NTILE)
```sql
WITH RFM_Base AS (
    SELECT 
        CustomerID,
        DATEDIFF(day, MAX(PurchaseDate), GETDATE()) AS Recency,
        COUNT(OrderID) AS Frequency,
        SUM(Sales) AS Monetary
    FROM Transactions
    GROUP BY CustomerID
)
SELECT 
    CustomerID,
    NTILE(5) OVER (ORDER BY Recency DESC) AS R_Score,
    NTILE(5) OVER (ORDER BY Frequency ASC) AS F_Score,
    NTILE(5) OVER (ORDER BY Monetary ASC) AS M_Score
FROM RFM_Base;
```
* **Key Concept:** `NTILE(5)` divides ordered customer metrics into quintiles (1-5 scores) for statistical RFM scoring.

### 2. Monthly Retention Rate Calculation (Self-Join Cohorts)
```sql
WITH MonthlyActive AS (
    SELECT DISTINCT CustomerID, FORMAT(PurchaseDate, 'yyyy-MM') as Month
    FROM Transactions
),
Retention AS (
    SELECT 
        m1.Month AS CurrentMonth,
        COUNT(DISTINCT m1.CustomerID) AS TotalCustomers,
        COUNT(DISTINCT m2.CustomerID) AS RetainedCustomers
    FROM MonthlyActive m1
    LEFT JOIN MonthlyActive m2 ON m1.CustomerID = m2.CustomerID 
        AND m2.Month = FORMAT(DATEADD(month, 1, CAST(m1.Month + '-01' AS DATE)), 'yyyy-MM')
    GROUP BY m1.Month
)
SELECT 
    CurrentMonth, TotalCustomers, RetainedCustomers, 
    CAST(RetainedCustomers AS FLOAT) / TotalCustomers AS RetentionRate 
FROM Retention ORDER BY CurrentMonth;
```
* **Key Concept:** `LEFT JOIN` on consecutive months checks month-over-month customer retention.

### 3. Pareto Principle Analysis (80/20 Revenue Concentration)
```sql
WITH RankedCustomers AS (
    SELECT 
        CustomerID,
        SUM(Sales) AS TotalSales,
        SUM(SUM(Sales)) OVER (ORDER BY SUM(Sales) DESC) AS RunningTotal,
        SUM(SUM(Sales)) OVER () AS GrandTotal
    FROM Transactions
    GROUP BY CustomerID
)
SELECT 
    COUNT(CustomerID) AS TopCustomersCount,
    (COUNT(CustomerID) * 100.0 / (SELECT COUNT(DISTINCT CustomerID) FROM Transactions)) AS PctOfTotalCustomers
FROM RankedCustomers
WHERE RunningTotal <= 0.80 * GrandTotal;
```
* **Key Concept:** Cumulative sum window function `SUM(...) OVER (ORDER BY ... DESC)` finds the exact top percentage of customers generating 80% of total revenue.

---

## 🛠️ 4. Technical System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                    │
│   Dashboard.jsx  |  Customers.jsx  | Recharts | Axios       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST API (JWT Header)
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend (Python)                 │
│   main.py  |  pandas Data Cleaning  |  scikit-learn KMeans  │
└──────────────────────────────┬──────────────────────────────┘
                               │ File-backed JSON / CSV
┌──────────────────────────────▼──────────────────────────────┐
│                  Local Persistent Data Layer                │
│   backend/db/users.json  |  backend/db/user_data/<email>/  │
└─────────────────────────────────────────────────────────────┘
```

---

## ❓ 5. Top Interview Questions & Answers

### 🧠 Data Science & Machine Learning Qs

#### Q1: Why did you use K-Means clustering instead of manual threshold rules for RFM?
> **Answer:** Manual rules (e.g., spend > $5,000 = VIP) rely on arbitrary human guesses that don't adapt to different datasets. K-Means clustering automatically discovers mathematical clusters in multi-dimensional space ($R, F, M$) based on variance within the actual dataset.

#### Q2: Why is `StandardScaler` mandatory before running K-Means?
> **Answer:** K-Means uses Euclidean distance calculation ($d = \sqrt{\sum (x_i - y_i)^2}$). In financial datasets, Monetary values can be in thousands ($5,000), while Frequency is in small numbers (2-10). Without scaling, Monetary would completely dominate the distance metric, rendering Recency and Frequency irrelevant. `StandardScaler` standardizes each feature to mean 0 and variance 1.

#### Q3: How does the system handle missing columns or partial CSV datasets?
> **Answer:** Segvista implements **Graceful Degradation**. The backend maps column aliases flexibly. If critical features for K-Means (RFM) are missing, it bypasses clustering, generates basic customer lists, computes whatever KPIs are possible (e.g., Total Revenue from Sales), and returns `warnings` to the frontend toast alert.

---

### ⚡ Backend & System Design Qs (FastAPI / Python)

#### Q4: How are JSON serialization errors with `NaN` and `Inf` handled in FastAPI?
> **Answer:** Standard `json.dumps` throws `ValueError: Out of range float values are not JSON compliant: nan` when pandas returns `NaN`. I implemented a recursive `clean_nan(obj)` utility function that replaces `NaN`/`Inf` with `None` (which serializes to valid `null` in JSON) before returning API responses.

#### Q5: How is user data isolated in a multi-tenant environment?
> **Answer:** Each request carries a JWT Authorization token. FastAPI's `get_current_user` dependency decodes the token to extract the user's email. Backend persistent storage indexes all datasets under user-specific paths (`backend/db/user_data/<sanitized_email>/`). Users can strictly view and analyze only their own uploaded data.

#### Q6: How does the app handle server restarts without losing user accounts or datasets?
> **Answer:** Data persistence is managed via JSON and CSV storage:
- User accounts are persisted in `backend/db/users.json`.
- Customer metrics and processed dashboard outputs are written to `backend/db/user_data/<email>/dashboard.json` and `customers.csv`.
- On backend startup, `load_users_db()` and `load_all_user_data()` populate memory from disk.
- Token signing uses a fixed secret key (`SECRET_KEY`), ensuring JWT signatures remain valid across restarts.

---

### 🎨 Frontend Qs (React / Recharts / Styling)

#### Q7: How does the dashboard provide feedback when a user uploads a CSV with missing fields?
> **Answer:** The frontend `Dashboard.jsx` displays custom `Toast` notifications. If the backend returns `warnings`, the toast renders a yellow warning alert containing a bulleted breakdown of exactly which analyses could not be calculated and why.

#### Q8: How did you implement centered navigation with responsive layout?
> **Answer:** Using CSS Grid in `App.css`:
```css
.navbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}
.nav-brand { justify-self: start; }
.nav-center-links { justify-self: center; }
.nav-auth-buttons { justify-self: end; }
```
This guarantees that navigation links remain horizontally centered regardless of brand title length or auth button sizes.

---

## 🚀 6. How to Deploy Segvista (Step-by-Step Production Guide)

Segvista can be deployed easily to cloud platforms like **Render**, **Railway**, **Vercel**, or via **Docker**.

### Option A: Render / Railway Deployment (Recommended for Fullstack)

#### 1. Backend Deployment (FastAPI on Render / Railway)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `SECRET_KEY`: Set a secure random key.

#### 2. Frontend Deployment (React on Vercel / Render Static Site)
- **Root Directory:** `frontend/`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:**
  - Set `VITE_API_URL` to your live backend URL (e.g. `https://segvista-api.onrender.com`).

---

### Option B: Docker Containerization

Create a `Dockerfile` in the root directory:

```dockerfile
# Step 1: Build Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Step 2: Set up Backend & Serve App
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend
COPY --from=frontend-build /app/frontend/dist ./frontend_dist

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🏆 Summary Checklist for Interview Presentation

- [x] Explain the business value (RFM customer segmentation + Churn prediction).
- [x] Explain machine learning pipeline (StandardScaler + K-Means clustering).
- [x] Discuss Python data cleaning (handling `$`, commas, date formats, boolean churn values).
- [x] Detail SQL expertise (25 queries: CTEs, Window Functions `NTILE`, `LAG`, Cohorts, Pareto 80/20).
- [x] Demonstrate System Design awareness (JWT auth, multi-tenant data isolation, disk persistence, graceful degradation).
