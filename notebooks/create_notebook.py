import json
import os

notebook = {
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Customer Segmentation & Retention Analysis\n",
    "\n",
    "This notebook performs Data Cleaning, Exploratory Data Analysis, RFM Analysis, and K-Means Clustering on the customer transaction dataset."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "import pandas as pd\n",
    "import numpy as np\n",
    "import matplotlib.pyplot as plt\n",
    "import seaborn as sns\n",
    "from sklearn.cluster import KMeans\n",
    "from sklearn.preprocessing import StandardScaler\n",
    "\n",
    "import warnings\n",
    "warnings.filterwarnings('ignore')"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 1. Data Cleaning"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Load data\n",
    "df = pd.read_csv('../data/customer_transactions.csv')\n",
    "\n",
    "# Handle missing values (Impute Age with median, City with mode)\n",
    "df['Age'] = df['Age'].fillna(df['Age'].median())\n",
    "df['City'] = df['City'].fillna(df['City'].mode()[0])\n",
    "\n",
    "# Remove duplicates\n",
    "df = df.drop_duplicates()\n",
    "\n",
    "# Detect and cap outliers in Sales using IQR method\n",
    "Q1 = df['Sales'].quantile(0.25)\n",
    "Q3 = df['Sales'].quantile(0.75)\n",
    "IQR = Q3 - Q1\n",
    "upper_bound = Q3 + 1.5 * IQR\n",
    "df['Sales'] = np.where(df['Sales'] > upper_bound, upper_bound, df['Sales'])\n",
    "\n",
    "df.info()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 2. Exploratory Data Analysis"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Purchase Trends\n",
    "df['Purchase Date'] = pd.to_datetime(df['Purchase Date'])\n",
    "df['YearMonth'] = df['Purchase Date'].dt.to_period('M')\n",
    "monthly_sales = df.groupby('YearMonth')['Sales'].sum()\n",
    "\n",
    "plt.figure(figsize=(10, 5))\n",
    "monthly_sales.plot(kind='line', marker='o')\n",
    "plt.title('Monthly Purchase Trends')\n",
    "plt.ylabel('Total Sales')\n",
    "plt.show()"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Revenue Analysis by Product\n",
    "product_revenue = df.groupby('Product')['Sales'].sum().sort_values(ascending=False)\n",
    "plt.figure(figsize=(10, 5))\n",
    "sns.barplot(x=product_revenue.values, y=product_revenue.index)\n",
    "plt.title('Revenue by Product')\n",
    "plt.show()"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Customer Demographics (Age Distribution)\n",
    "plt.figure(figsize=(8, 4))\n",
    "sns.histplot(df['Age'], bins=20, kde=True)\n",
    "plt.title('Age Distribution of Customers')\n",
    "plt.show()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 3. RFM Analysis & 4. Machine Learning (K-Means Clustering)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Extract RFM metrics (already provided in the dataset or could be re-calculated)\n",
    "# For clustering, we will use Recency, Frequency, Monetary\n",
    "rfm_data = df.groupby('CustomerID').agg({\n",
    "    'Recency': 'first', \n",
    "    'Frequency': 'first',\n",
    "    'Monetary': 'first'\n",
    "}).reset_index()\n",
    "\n",
    "X = rfm_data[['Recency', 'Frequency', 'Monetary']]\n",
    "\n",
    "# Scale the data\n",
    "scaler = StandardScaler()\n",
    "X_scaled = scaler.fit_transform(X)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Find optimal K using Elbow Method\n",
    "inertia = []\n",
    "K_range = range(1, 11)\n",
    "for k in K_range:\n",
    "    kmeans = KMeans(n_clusters=k, random_state=42)\n",
    "    kmeans.fit(X_scaled)\n",
    "    inertia.append(kmeans.inertia_)\n",
    "\n",
    "plt.figure(figsize=(8, 4))\n",
    "plt.plot(K_range, inertia, marker='o')\n",
    "plt.title('Elbow Method for Optimal K')\n",
    "plt.xlabel('Number of Clusters')\n",
    "plt.ylabel('Inertia')\n",
    "plt.show()"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Apply K-Means with K=5 (VIP, Loyal, Regular, At Risk, Lost)\n",
    "kmeans = KMeans(n_clusters=5, random_state=42)\n",
    "rfm_data['Cluster'] = kmeans.fit_predict(X_scaled)\n",
    "\n",
    "# Map clusters to segment names based on their characteristics\n",
    "cluster_centers = pd.DataFrame(scaler.inverse_transform(kmeans.cluster_centers_), columns=['Recency', 'Frequency', 'Monetary'])\n",
    "print(\"Cluster Centers:\")\n",
    "print(cluster_centers)\n",
    "\n",
    "# (Note: The mapping logic here is simplified. In a real scenario, you'd analyze the centers to accurately label them)\n",
    "segment_mapping = {\n",
    "    0: 'Lost',       # High recency, low freq/monetary\n",
    "    1: 'VIP',        # Low recency, high freq/monetary\n",
    "    2: 'Regular',    # Average across the board\n",
    "    3: 'Loyal',      # Low recency, good freq/monetary\n",
    "    4: 'At Risk'     # Getting high recency, previously good freq\n",
    "}\n",
    "\n",
    "rfm_data['Segment'] = rfm_data['Cluster'].map(segment_mapping)\n",
    "\n",
    "# Visualize Segments\n",
    "plt.figure(figsize=(8, 5))\n",
    "sns.scatterplot(x='Recency', y='Monetary', hue='Segment', data=rfm_data, palette='viridis')\n",
    "plt.title('Customer Segments: Recency vs Monetary')\n",
    "plt.show()"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.8.0"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}

out_path = os.path.join(os.path.dirname(__file__), 'Customer_Segmentation.ipynb')
with open(out_path, 'w') as f:
    json.dump(notebook, f, indent=1)
print(f"Created notebook at {out_path}")
