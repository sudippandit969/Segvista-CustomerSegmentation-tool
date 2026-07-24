from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import os
import io
import json
import hashlib
import hmac
import base64
import time
import datetime
from dotenv import load_dotenv

from sqlalchemy import create_engine, Column, String, Text, DateTime, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

app = FastAPI(title="Segvista API")

# ─── CORS ──────────────────────────────────────────────────────────────────────
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── UTILITY ───────────────────────────────────────────────────────────────────
def clean_nan(obj):
    """Recursively replace NaN/Inf values with None for JSON serialization."""
    if isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan(item) for item in obj]
    elif isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    return obj


# ─── DATABASE SETUP ────────────────────────────────────────────────────────────
# Load local development secrets from backend/.env. Production platforms should
# provide DATABASE_URL through their environment settings.
load_dotenv()
_RAW_DB_URL = os.getenv("DATABASE_URL")
if not _RAW_DB_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. Copy backend/.env.example to "
        "backend/.env and add your Neon connection string."
    )

# Strip unsupported psycopg2 params (channel_binding) from the URL query string
if "channel_binding" in _RAW_DB_URL:
    from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
    parsed = urlparse(_RAW_DB_URL)
    qparams = {k: v[0] for k, v in parse_qs(parsed.query).items()
                if k != "channel_binding"}
    _RAW_DB_URL = urlunparse(parsed._replace(query=urlencode(qparams)))

DATABASE_URL = _RAW_DB_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"},
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── DATABASE MODELS ───────────────────────────────────────────────────────────
class UserModel(Base):
    __tablename__ = "users"
    email        = Column(String, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at   = Column(DateTime, default=datetime.datetime.utcnow)


class UserDataModel(Base):
    __tablename__ = "user_data"
    email          = Column(String, primary_key=True, index=True)
    dashboard_json = Column(Text, nullable=True)
    customers_json = Column(Text, nullable=True)
    updated_at     = Column(DateTime, default=datetime.datetime.utcnow,
                            onupdate=datetime.datetime.utcnow)


# Create tables if they don't exist
Base.metadata.create_all(bind=engine)


# ─── DB HELPER FUNCTIONS ───────────────────────────────────────────────────────
def db_get_user(email: str):
    with SessionLocal() as db:
        return db.query(UserModel).filter(UserModel.email == email).first()


def db_create_user(name: str, email: str, password_hash: str):
    with SessionLocal() as db:
        user = UserModel(name=name, email=email, password_hash=password_hash)
        db.add(user)
        db.commit()


def db_save_user_data(email: str, dashboard_data: dict, df_customers: pd.DataFrame):
    """Upsert dashboard JSON + customers JSON to PostgreSQL."""
    dash_json = json.dumps(clean_nan(dashboard_data))
    cust_json = df_customers.to_json(orient="records")
    with SessionLocal() as db:
        record = db.query(UserDataModel).filter(UserDataModel.email == email).first()
        if record:
            record.dashboard_json = dash_json
            record.customers_json = cust_json
            record.updated_at = datetime.datetime.utcnow()
        else:
            record = UserDataModel(
                email=email,
                dashboard_json=dash_json,
                customers_json=cust_json,
            )
            db.add(record)
        db.commit()


def db_load_user_data(email: str):
    """Load user's processed data from PostgreSQL. Returns dict or None."""
    with SessionLocal() as db:
        record = db.query(UserDataModel).filter(UserDataModel.email == email).first()
        if record and record.dashboard_json and record.customers_json:
            return {
                "dashboard_data": json.loads(record.dashboard_json),
                "df_customers": pd.read_json(io.StringIO(record.customers_json),
                                             orient="records"),
            }
    return None


def db_load_all_user_data():
    """Load all stored user data into memory cache on startup."""
    store = {}
    with SessionLocal() as db:
        records = db.query(UserDataModel).all()
        for rec in records:
            try:
                if rec.dashboard_json and rec.customers_json:
                    store[rec.email] = {
                        "dashboard_data": json.loads(rec.dashboard_json),
                        "df_customers": pd.read_json(
                            io.StringIO(rec.customers_json), orient="records"
                        ),
                    }
            except Exception as e:
                print(f"[STARTUP] Could not load data for {rec.email}: {e}")
    return store


# ─── STARTUP: warm memory cache from DB ────────────────────────────────────────
try:
    user_data_store = db_load_all_user_data()
    with SessionLocal() as db:
        user_count = db.query(UserModel).count()
    print(f"[STARTUP] Connected to Neon PostgreSQL. "
          f"{user_count} users, {len(user_data_store)} datasets loaded.")
except Exception as e:
    print(f"[STARTUP ERROR] Could not connect to database: {e}")
    user_data_store = {}


# ─── AUTH ──────────────────────────────────────────────────────────────────────
SECRET_KEY   = os.getenv("SECRET_KEY", "segvista_app_secret_key_2026_do_not_share")
TOKEN_EXPIRY = 86400  # 24 hours


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_token(email: str) -> str:
    payload      = {"email": email, "exp": int(time.time()) + TOKEN_EXPIRY}
    payload_b64  = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature    = hmac.new(SECRET_KEY.encode(), payload_b64.encode(),
                            hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"


def decode_token(token: str) -> str:
    try:
        payload_b64, signature = token.split(".")
        expected = hmac.new(SECRET_KEY.encode(), payload_b64.encode(),
                            hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("bad signature")
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode()).decode())
        if payload.get("exp", 0) < time.time():
            raise ValueError("expired")
        return payload["email"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    return decode_token(token)


# ─── REQUEST MODELS ────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ─── DATA PROCESSING (unchanged ML logic) ─────────────────────────────────────
COLUMN_ALIASES = {
    'CustomerID':             ['customerid','customer_id','cust_id','custid','id'],
    'Sales':                  ['sales','sale','amount','total','revenue','total_sales'],
    'Purchase Date':          ['purchase date','purchase_date','purchasedate','date',
                               'order_date','orderdate','transaction_date'],
    'Recency':                ['recency','recency_days','days_since_last'],
    'Frequency':              ['frequency','freq','purchase_frequency','order_count'],
    'Monetary':               ['monetary','monetary_value','total_spend','spend'],
    'Customer Lifetime Value':['customer lifetime value','customer_lifetime_value',
                               'customerlifetimevalue','clv','ltv','lifetime_value','cltv'],
    'Churn':                  ['churn','churned','is_churned','churn_flag'],
    'Payment Mode':           ['payment mode','payment_mode','paymentmode',
                               'payment_method','payment_type','pay_mode'],
}


def match_columns(df):
    df_cols_lower = {col.lower().strip(): col for col in df.columns}
    mapping, missing = {}, []
    for required, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in df_cols_lower:
                mapping[required] = df_cols_lower[alias]
                break
        else:
            missing.append(required)
    return mapping, missing


def has_col(df, col):
    return col in df.columns


def process_data(df):
    warnings = []
    mapping, _ = match_columns(df)
    df = df.rename(columns={v: k for k, v in mapping.items()})

    if not has_col(df, 'CustomerID'):
        raise ValueError(
            f"Your CSV must have a CustomerID column. "
            f"Your columns: {', '.join(df.columns.tolist())}"
        )

    # Clean numeric columns
    for col in ['Sales', 'Recency', 'Frequency', 'Monetary',
                'Customer Lifetime Value', 'Churn']:
        if not has_col(df, col):
            continue
        df[col] = df[col].astype(str).str.strip()
        if col == 'Churn':
            bool_map = {'yes':1,'no':0,'true':1,'false':0,
                        '1':1,'0':0,'1.0':1,'0.0':0,'y':1,'n':0}
            df[col] = df[col].str.lower().map(bool_map)
        else:
            df[col] = pd.to_numeric(
                df[col].str.replace(r'[$,\s]', '', regex=True), errors='coerce'
            )

    if has_col(df, 'Purchase Date'):
        df['Purchase Date'] = pd.to_datetime(df['Purchase Date'],
                                             errors='coerce', dayfirst=False)

    has_rfm     = all(has_col(df, c) for c in ['Recency','Frequency','Monetary'])
    has_sales   = has_col(df, 'Sales')
    has_ltv     = has_col(df, 'Customer Lifetime Value')
    has_churn   = has_col(df, 'Churn')
    has_dates   = has_col(df, 'Purchase Date')
    has_payment = has_col(df, 'Payment Mode')

    if not has_rfm:
        missing_rfm = [c for c in ['Recency','Frequency','Monetary'] if not has_col(df,c)]
        warnings.append(f"Customer Segmentation unavailable — missing: {', '.join(missing_rfm)}")
    if not has_sales:   warnings.append("Total Revenue KPI unavailable — missing: Sales")
    if not has_ltv:     warnings.append("Average LTV unavailable — missing: Customer Lifetime Value")
    if not has_churn:   warnings.append("Churn Rate unavailable — missing: Churn")
    if not (has_dates and has_sales):
        parts = ([p for p in ['Purchase Date','Sales']
                  if not has_col(df, p)])
        warnings.append(f"Sales Trend unavailable — missing: {', '.join(parts)}")
    if not has_payment: warnings.append("Payment Mode chart unavailable — missing: Payment Mode")

    active_customers = int(df['CustomerID'].nunique())
    total_revenue    = float(df['Sales'].sum()) if has_sales else None
    avg_ltv          = (float(df['Customer Lifetime Value'].mean())
                        if has_ltv and df['Customer Lifetime Value'].notna().any()
                        else None)
    churn_rate       = (float(df['Churn'].mean() * 100)
                        if has_churn and df['Churn'].notna().any()
                        else None)

    df_customers       = None
    segment_distribution = []
    segment_value        = []

    if has_rfm:
        agg = {'Recency':'first','Frequency':'first','Monetary':'first'}
        if has_ltv:   agg['Customer Lifetime Value'] = 'first'
        if has_churn: agg['Churn'] = 'first'
        rfm = df.groupby('CustomerID').agg(agg).reset_index()
        rfm = rfm.dropna(subset=['Recency','Frequency','Monetary'])

        if len(rfm) >= 5:
            X       = rfm[['Recency','Frequency','Monetary']]
            X_sc    = StandardScaler().fit_transform(X)
            k       = min(5, len(rfm))
            rfm['Cluster']  = KMeans(n_clusters=k, random_state=42, n_init=10).fit_predict(X_sc)
            names            = ['Lost','VIP','Regular','Loyal','At Risk']
            rfm['Segment']   = rfm['Cluster'].map({i: names[i] for i in range(k)})
            df               = df.merge(rfm[['CustomerID','Segment']],
                                        on='CustomerID', how='left')
            df_customers     = rfm.copy()
            sc               = rfm['Segment'].value_counts().reset_index()
            sc.columns       = ['name','value']
            segment_distribution = sc.to_dict(orient='records')
            sa               = rfm.groupby('Segment')['Monetary'].mean().reset_index()
            sa.columns       = ['name','avg_monetary']
            segment_value    = sa.to_dict(orient='records')
        else:
            warnings.append(f"Not enough customers for clustering (need ≥5, got {len(rfm)})")

    if df_customers is None:
        keep = ['CustomerID'] + [c for c in
                ['Recency','Frequency','Monetary','Customer Lifetime Value','Churn']
                if has_col(df, c)]
        df_customers = df.groupby('CustomerID').first().reset_index()[
            [c for c in keep if c in df.columns]
        ]
        df_customers['Segment'] = 'Unclassified'

    sales_trend = []
    if has_dates and has_sales:
        valid = df.dropna(subset=['Purchase Date']).copy()
        if len(valid) > 0:
            valid['YearMonth'] = valid['Purchase Date'].dt.to_period('M').astype(str)
            monthly = valid.groupby('YearMonth')['Sales'].sum().reset_index()
            monthly.columns = ['month','sales']
            sales_trend = monthly.tail(12).to_dict(orient='records')

    payment_modes = []
    if has_payment and 'Segment' in df.columns:
        try:
            pdata = df.groupby(['Segment','Payment Mode'])['CustomerID'].count().reset_index()
            ppivot = (pdata.pivot(index='Segment', columns='Payment Mode', values='CustomerID')
                      .fillna(0).reset_index())
            payment_modes = ppivot.to_dict(orient='records')
        except Exception:
            pass

    dashboard_data = {
        "kpis": {
            "totalRevenue":    total_revenue,
            "activeCustomers": active_customers,
            "averageLtv":      avg_ltv,
            "churnRate":       churn_rate,
        },
        "deltas": {"totalRevenue":12.5,"activeCustomers":5.2,"averageLtv":2.1,"churnRate":0.5},
        "charts": {
            "segmentDistribution": segment_distribution,
            "segmentValue":        segment_value,
            "salesTrend":          sales_trend,
            "paymentModes":        payment_modes,
        },
    }
    return dashboard_data, df_customers, warnings


# ─── AUTH ENDPOINTS ────────────────────────────────────────────────────────────
@app.post("/api/register")
def register(req: RegisterRequest):
    if db_get_user(req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    db_create_user(req.name, req.email, hash_password(req.password))
    token = create_token(req.email)
    return {"token": token, "user": {"name": req.name, "email": req.email}}


@app.post("/api/login")
def login(req: LoginRequest):
    user = db_get_user(req.email)
    if not user or user.password_hash != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # Warm cache if not already loaded
    if req.email not in user_data_store:
        data = db_load_user_data(req.email)
        if data:
            user_data_store[req.email] = data
    token = create_token(req.email)
    return {"token": token, "user": {"name": user.name, "email": user.email}}


# ─── PROTECTED ENDPOINTS ───────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"message": "Segvista API is running ✅"}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...),
                      email: str = Depends(get_current_user)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        dashboard_data, df_customers, warnings = process_data(df)

        # Update memory cache
        user_data_store[email] = {
            "dashboard_data": dashboard_data,
            "df_customers": df_customers,
        }
        # Persist to PostgreSQL
        db_save_user_data(email, dashboard_data, df_customers)

        return {
            "status": "success",
            "message": f"Data processed! {len(df_customers)} customers analyzed.",
            "warnings": warnings,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Could not process file: {e}")


@app.get("/api/dashboard")
def get_dashboard(email: str = Depends(get_current_user)):
    if email not in user_data_store:
        data = db_load_user_data(email)
        if data:
            user_data_store[email] = data
    store = user_data_store.get(email)
    if not store:
        return {}
    return clean_nan(store["dashboard_data"])


@app.get("/api/customers/top")
def get_top_customers(email: str = Depends(get_current_user)):
    if email not in user_data_store:
        data = db_load_user_data(email)
        if data:
            user_data_store[email] = data
    store = user_data_store.get(email)
    if not store:
        return {"vips": [], "atRisk": []}
    df_c = store["df_customers"].fillna(0)
    vips, at_risk = [], []
    if "Segment" in df_c.columns and "Monetary" in df_c.columns:
        vip_df  = df_c[df_c["Segment"] == "VIP"]
        risk_df = df_c[df_c["Segment"] == "At Risk"]
        if len(vip_df)  > 0: vips    = vip_df.nlargest(5, "Monetary").to_dict(orient="records")
        if len(risk_df) > 0: at_risk = risk_df.nlargest(5, "Monetary").to_dict(orient="records")
    return clean_nan({"vips": vips, "atRisk": at_risk})


@app.get("/api/customers")
def get_customers(segment: str = None, email: str = Depends(get_current_user)):
    if email not in user_data_store:
        data = db_load_user_data(email)
        if data:
            user_data_store[email] = data
    store = user_data_store.get(email)
    if not store:
        return []
    df_c = store["df_customers"].fillna(0)
    if segment and segment != "All" and "Segment" in df_c.columns:
        df_c = df_c[df_c["Segment"] == segment]
    return clean_nan(df_c.to_dict(orient="records"))


@app.get("/api/export")
def export_customers(segment: str = None, token: str = None,
                     email: str = None):
    if token:
        email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Authentication required")
    if email not in user_data_store:
        data = db_load_user_data(email)
        if data:
            user_data_store[email] = data
    store = user_data_store.get(email)
    if not store:
        raise HTTPException(status_code=404,
                            detail="No data found. Please upload a CSV first.")
    df_c = store["df_customers"]
    if segment and segment != "All" and "Segment" in df_c.columns:
        df_c = df_c[df_c["Segment"] == segment]
    stream = io.StringIO()
    df_c.to_csv(stream, index=False)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=customers_export.csv"
    return response
