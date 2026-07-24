import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

NUM_RECORDS = 15000
NUM_CUSTOMERS = 5000

print(f"Generating dataset with {NUM_RECORDS} records and {NUM_CUSTOMERS} customers...")

# 1. Generate Customer Data
customer_ids = [f"CUST_{str(i).zfill(5)}" for i in range(1, NUM_CUSTOMERS + 1)]
genders = np.random.choice(['Male', 'Female', 'Other'], size=NUM_CUSTOMERS, p=[0.48, 0.48, 0.04])
ages = np.random.randint(18, 70, size=NUM_CUSTOMERS)
cities = np.random.choice(
    ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'], 
    size=NUM_CUSTOMERS
)

# Signup dates between 2020-01-01 and 2023-01-01
start_signup = datetime(2020, 1, 1)
end_signup = datetime(2023, 1, 1)
signup_dates = [start_signup + timedelta(days=random.randint(0, (end_signup - start_signup).days)) for _ in range(NUM_CUSTOMERS)]

customers_df = pd.DataFrame({
    'CustomerID': customer_ids,
    'Gender': genders,
    'Age': ages,
    'City': cities,
    'Signup Date': signup_dates
})

# 2. Generate Transaction Data
# Assign random customer to each transaction
transaction_customers = np.random.choice(customer_ids, size=NUM_RECORDS)

# Products and pricing
products = ['Laptop', 'Smartphone', 'Headphones', 'Monitor', 'Keyboard', 'Mouse', 'Tablet', 'Smartwatch']
product_prices = {'Laptop': 1200, 'Smartphone': 800, 'Headphones': 150, 'Monitor': 300, 'Keyboard': 100, 'Mouse': 50, 'Tablet': 400, 'Smartwatch': 250}

transaction_products = np.random.choice(products, size=NUM_RECORDS)
quantities = np.random.randint(1, 5, size=NUM_RECORDS)
sales = [product_prices[p] * q for p, q in zip(transaction_products, quantities)]
payment_modes = np.random.choice(['Credit Card', 'Debit Card', 'PayPal', 'UPI', 'Bank Transfer'], size=NUM_RECORDS)

transactions_df = pd.DataFrame({
    'CustomerID': transaction_customers,
    'Product': transaction_products,
    'Quantity': quantities,
    'Sales': sales,
    'Payment Mode': payment_modes
})

# Merge to get Signup Date for generating Purchase Date
df = pd.merge(transactions_df, customers_df, on='CustomerID', how='left')

# Generate Purchase Date strictly after Signup Date, up to 2023-12-31
end_purchase = datetime(2023, 12, 31)
def generate_purchase_date(signup_date):
    max_days = (end_purchase - signup_date).days
    if max_days <= 0:
        return signup_date
    return signup_date + timedelta(days=random.randint(0, max_days))

df['Purchase Date'] = df['Signup Date'].apply(generate_purchase_date)

# 3. Calculate RFM & LTV per customer to include in the dataset
# Though normally done in analysis, the prompt requests them as columns in the dataset.
reference_date = end_purchase + timedelta(days=1)

# Group by CustomerID
rfm = df.groupby('CustomerID').agg({
    'Purchase Date': lambda x: (reference_date - x.max()).days, # Recency
    'Product': 'count', # Frequency
    'Sales': 'sum' # Monetary
}).reset_index()
rfm.columns = ['CustomerID', 'Recency', 'Frequency', 'Monetary']

# Calculate LTV (simplified: Average Order Value * Frequency) - here it's just Monetary, but let's make it lifetime projection
# Let's say LTV = Monetary * random factor to simulate future value
np.random.seed(42)
rfm['Customer Lifetime Value'] = rfm['Monetary'] * np.random.uniform(1.1, 2.5, size=len(rfm))
rfm['Customer Lifetime Value'] = rfm['Customer Lifetime Value'].round(2)

# Churn definition: If Recency > 180 days, customer is considered churned (1), else active (0)
rfm['Churn'] = rfm['Recency'].apply(lambda x: 1 if x > 180 else 0)

# 4. Final Merge
final_df = pd.merge(df, rfm, on='CustomerID', how='left')

# Reorder columns as requested
cols = [
    'CustomerID', 'Gender', 'Age', 'City', 'Signup Date', 'Purchase Date', 
    'Product', 'Quantity', 'Sales', 'Payment Mode', 
    'Frequency', 'Recency', 'Monetary', 'Customer Lifetime Value', 'Churn'
]
final_df = final_df[cols]

# Introduce some missing values and outliers for Data Cleaning task
# Missing values
missing_indices = np.random.choice(final_df.index, size=300, replace=False)
final_df.loc[missing_indices, 'Age'] = np.nan

missing_cities = np.random.choice(final_df.index, size=150, replace=False)
final_df.loc[missing_cities, 'City'] = np.nan

# Outliers in Sales
outlier_indices = np.random.choice(final_df.index, size=50, replace=False)
final_df.loc[outlier_indices, 'Sales'] = final_df.loc[outlier_indices, 'Sales'] * 10

# Duplicates
duplicates = final_df.sample(n=100, random_state=1)
final_df = pd.concat([final_df, duplicates], ignore_index=True)
# Now we have 15100 records, so let's sample back to exactly 15000? No, let's just keep 15100 so there's duplicates to remove, or drop from original first.
final_df = final_df.iloc[:15000] 
# Wait, if I slice, I might lose the duplicates if they were appended at the end.
# Let's drop 100 rows from the original before appending.
final_df = final_df.drop(final_df.index[:100])
final_df = pd.concat([final_df, duplicates], ignore_index=True)
# Ensure exactly 15000 rows
final_df = final_df.sample(n=15000, random_state=42).reset_index(drop=True)

# Save to CSV
output_path = os.path.join(os.path.dirname(__file__), 'customer_transactions.csv')
final_df.to_csv(output_path, index=False)
print(f"Dataset generated successfully at {output_path} with shape {final_df.shape}")
