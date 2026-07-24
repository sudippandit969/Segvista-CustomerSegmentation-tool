# Power BI Dashboard Implementation Guide
**Project:** Customer Segmentation & Retention Analysis

This guide provides a structured approach to building the Power BI dashboard as part of the Customer Segmentation project.

## 1. Data Connection & Preparation
1. **Import Data:** Connect Power BI to `data/customer_transactions.csv`.
2. **Data Types:** Ensure `Purchase Date` and `Signup Date` are set to `Date/Time`. `Sales`, `Quantity`, `Recency`, `Frequency`, `Monetary`, and `Customer Lifetime Value` should be numeric.
3. **Measures to Create (DAX):**
   - `Total Revenue = SUM(Transactions[Sales])`
   - `Total Customers = DISTINCTCOUNT(Transactions[CustomerID])`
   - `Average Spend = AVERAGE(Transactions[Sales])`
   - `Churn Rate = DIVIDE(CALCULATE([Total Customers], Transactions[Churn] = 1), [Total Customers])`
   - `Retention Rate = 1 - [Churn Rate]`
   - `Average LTV = AVERAGE(Transactions[Customer Lifetime Value])`
   - `Repeat Customers = CALCULATE([Total Customers], Transactions[Frequency] > 1)`
   - `New Customers = CALCULATE([Total Customers], Transactions[Frequency] = 1)`

## 2. Executive Dashboard
**Goal:** High-level overview of business performance.
* **KPI Cards:** Total Revenue, Total Customers, Average Spend, Churn Rate, Retention Rate.
* **Line Chart:** Revenue over time (`Purchase Date` hierarchy: Year/Month).
* **Donut Chart:** Revenue by Customer Segment (if Segment is imported/calculated in Power BI, or use Python integration to fetch the K-Means labels).
* **Map Visual:** Revenue by `City`.

## 3. Customer Dashboard
**Goal:** Deep dive into customer demographics and behavior.
* **KPI Cards:** Repeat Customers, New Customers, Average LTV.
* **Bar Chart:** Top 10 Products by Sales.
* **Column Chart:** Sales by Age Group (Create a calculated column grouping ages into 18-25, 26-35, 36-50, 50+).
* **Pie Chart:** Sales by Gender.
* **Tree Map:** Sales by Payment Mode.

## 4. Retention Dashboard
**Goal:** Analyzing churn and customer loyalty.
* **KPI Cards:** Churn Rate, Retention Rate.
* **Line Chart (Cohort Analysis):** Retention rate by Cohort (Signup Month) over time.
* **Scatter Plot:** Recency vs. Frequency (helps identify At-Risk customers).
* **Table:** List of At-Risk customers (Filter `Recency` > 90 days, sorted by `Monetary` descending) to highlight high-value customers likely to churn.

## 5. Segment Dashboard
**Goal:** Actionable insights based on K-Means clustering.
* **Filters/Slicers:** Segment (VIP, Loyal, Regular, At Risk, Lost).
* **KPI Cards:** Average Spend per Segment, Total Customers in Segment, Average Frequency.
* **Bar Chart:** Preferred Payment Mode by Segment.
* **Matrix:** Products bought across different Segments.
* **Scatter Plot:** Customer Lifetime Value vs. Frequency, colored by Segment.

## Next Steps
1. Apply a consistent, modern theme (e.g., Dark Mode with vibrant contrasting colors).
2. Set up interactive filtering between visuals (e.g., clicking on 'VIP' segment filters all other charts on the page).
3. Publish to Power BI Service and set up scheduled refreshes if connecting to a live SQL database.
