-- ==========================================
-- Customer Segmentation & Retention Analysis
-- 25 Advanced SQL Queries
-- ==========================================

-- 1. Total Revenue by Customer Segment (Assuming segments are stored or derived dynamically)
WITH RFM_Calc AS (
    SELECT 
        CustomerID,
        MAX(PurchaseDate) as LastPurchase,
        COUNT(OrderID) as Frequency,
        SUM(Sales) as Monetary
    FROM Transactions
    GROUP BY CustomerID
)
SELECT 
    CASE 
        WHEN Monetary > 5000 AND Frequency > 10 THEN 'VIP'
        WHEN Monetary > 2000 AND Frequency > 5 THEN 'Loyal'
        WHEN LastPurchase < DATEADD(month, -6, GETDATE()) THEN 'At Risk'
        ELSE 'Regular'
    END AS Segment,
    SUM(Monetary) AS Total_Revenue
FROM RFM_Calc
GROUP BY 
    CASE 
        WHEN Monetary > 5000 AND Frequency > 10 THEN 'VIP'
        WHEN Monetary > 2000 AND Frequency > 5 THEN 'Loyal'
        WHEN LastPurchase < DATEADD(month, -6, GETDATE()) THEN 'At Risk'
        ELSE 'Regular'
    END
ORDER BY Total_Revenue DESC;

-- 2. Monthly Retention Rate
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
    CurrentMonth, 
    TotalCustomers, 
    RetainedCustomers, 
    CAST(RetainedCustomers AS FLOAT) / TotalCustomers AS RetentionRate 
FROM Retention
ORDER BY CurrentMonth;

-- 3. Customer Churn Rate by Demographics (Age Group & Gender)
WITH ChurnData AS (
    SELECT 
        c.Gender,
        CASE 
            WHEN c.Age BETWEEN 18 AND 25 THEN '18-25'
            WHEN c.Age BETWEEN 26 AND 35 THEN '26-35'
            WHEN c.Age BETWEEN 36 AND 50 THEN '36-50'
            ELSE '50+' 
        END AS AgeGroup,
        MAX(t.PurchaseDate) as LastPurchase
    FROM Customers c
    JOIN Transactions t ON c.CustomerID = t.CustomerID
    GROUP BY c.CustomerID, c.Gender, c.Age
)
SELECT 
    Gender, 
    AgeGroup, 
    COUNT(CASE WHEN LastPurchase < DATEADD(day, -180, GETDATE()) THEN 1 END) * 1.0 / COUNT(*) AS ChurnRate
FROM ChurnData
GROUP BY Gender, AgeGroup
ORDER BY ChurnRate DESC;

-- 4. Customer Lifetime Value (CLV) Calculation per City
SELECT 
    c.City,
    AVG(t.Sales) AS AverageSpendPerTransaction,
    COUNT(t.OrderID) * 1.0 / COUNT(DISTINCT c.CustomerID) AS AverageFrequency,
    (AVG(t.Sales) * (COUNT(t.OrderID) * 1.0 / COUNT(DISTINCT c.CustomerID))) AS Avg_CLV
FROM Customers c
JOIN Transactions t ON c.CustomerID = t.CustomerID
GROUP BY c.City
ORDER BY Avg_CLV DESC;

-- 5. Top 5 Products by Revenue for Repeat Customers
WITH RepeatCustomers AS (
    SELECT CustomerID
    FROM Transactions
    GROUP BY CustomerID
    HAVING COUNT(OrderID) > 1
)
SELECT TOP 5 
    Product, 
    SUM(Sales) AS TotalRevenue
FROM Transactions
WHERE CustomerID IN (SELECT CustomerID FROM RepeatCustomers)
GROUP BY Product
ORDER BY TotalRevenue DESC;

-- 6. Sales Trend: Year-over-Year (YoY) Growth
WITH YearlySales AS (
    SELECT 
        YEAR(PurchaseDate) AS SalesYear,
        SUM(Sales) AS TotalSales
    FROM Transactions
    GROUP BY YEAR(PurchaseDate)
)
SELECT 
    SalesYear,
    TotalSales,
    LAG(TotalSales) OVER (ORDER BY SalesYear) AS PrevYearSales,
    (TotalSales - LAG(TotalSales) OVER (ORDER BY SalesYear)) * 100.0 / NULLIF(LAG(TotalSales) OVER (ORDER BY SalesYear), 0) AS YoY_Growth_Pct
FROM YearlySales;

-- 7. Payment Mode Preferences by Customer Segment
SELECT 
    Segment,
    PaymentMode,
    COUNT(OrderID) AS TransactionCount
FROM CustomerSegments cs
JOIN Transactions t ON cs.CustomerID = t.CustomerID
GROUP BY Segment, PaymentMode
ORDER BY Segment, TransactionCount DESC;

-- 8. Cohort Analysis: Average Spend of Customers by Signup Month
WITH SignupMonth AS (
    SELECT 
        CustomerID, 
        FORMAT(SignupDate, 'yyyy-MM') AS CohortMonth
    FROM Customers
)
SELECT 
    s.CohortMonth,
    FORMAT(t.PurchaseDate, 'yyyy-MM') AS PurchaseMonth,
    AVG(t.Sales) AS AverageSpend
FROM SignupMonth s
JOIN Transactions t ON s.CustomerID = t.CustomerID
GROUP BY s.CohortMonth, FORMAT(t.PurchaseDate, 'yyyy-MM')
ORDER BY s.CohortMonth, PurchaseMonth;

-- 9. Identifying Outliers: Transactions greater than 3 Standard Deviations from Mean
WITH SalesStats AS (
    SELECT 
        AVG(Sales) AS MeanSales,
        STDEV(Sales) AS StdDevSales
    FROM Transactions
)
SELECT t.*
FROM Transactions t
CROSS JOIN SalesStats s
WHERE t.Sales > (s.MeanSales + 3 * s.StdDevSales);

-- 10. Moving Average of Sales (7-Day)
SELECT 
    PurchaseDate,
    SUM(Sales) AS DailySales,
    AVG(SUM(Sales)) OVER(ORDER BY PurchaseDate ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS MovingAvg_7Day
FROM Transactions
GROUP BY PurchaseDate
ORDER BY PurchaseDate;

-- 11. RFM Score Assignment (1 to 5 scale)
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

-- 12. Percentage of One-Time vs Repeat Buyers
WITH BuyerType AS (
    SELECT 
        CustomerID,
        CASE WHEN COUNT(OrderID) = 1 THEN 'One-Time' ELSE 'Repeat' END AS Type
    FROM Transactions
    GROUP BY CustomerID
)
SELECT 
    Type,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM BuyerType) AS Percentage
FROM BuyerType
GROUP BY Type;

-- 13. Average Days Between Purchases for Repeat Customers
WITH PurchaseDates AS (
    SELECT 
        CustomerID,
        PurchaseDate,
        LAG(PurchaseDate) OVER (PARTITION BY CustomerID ORDER BY PurchaseDate) AS PrevPurchase
    FROM Transactions
)
SELECT 
    CustomerID,
    AVG(DATEDIFF(day, PrevPurchase, PurchaseDate)) AS AvgDaysBetweenPurchases
FROM PurchaseDates
WHERE PrevPurchase IS NOT NULL
GROUP BY CustomerID;

-- 14. Top 10% of Customers by Revenue
WITH CustomerRevenue AS (
    SELECT 
        CustomerID,
        SUM(Sales) AS TotalSpend,
        PERCENT_RANK() OVER (ORDER BY SUM(Sales) DESC) AS PctRank
    FROM Transactions
    GROUP BY CustomerID
)
SELECT CustomerID, TotalSpend
FROM CustomerRevenue
WHERE PctRank <= 0.10;

-- 15. Cross-Selling Opportunities: Products frequently bought together
WITH ProductPairs AS (
    SELECT 
        t1.Product AS ProductA, 
        t2.Product AS ProductB
    FROM Transactions t1
    JOIN Transactions t2 ON t1.CustomerID = t2.CustomerID 
        AND t1.OrderID != t2.OrderID 
        AND t1.Product < t2.Product
)
SELECT TOP 10 
    ProductA, 
    ProductB, 
    COUNT(*) AS PairFrequency
FROM ProductPairs
GROUP BY ProductA, ProductB
ORDER BY PairFrequency DESC;

-- 16. Churn Prediction Feature: Decline in Purchase Frequency
WITH MonthlyFreq AS (
    SELECT 
        CustomerID, 
        YEAR(PurchaseDate) AS Yr, 
        MONTH(PurchaseDate) AS Mth, 
        COUNT(OrderID) AS Freq
    FROM Transactions
    GROUP BY CustomerID, YEAR(PurchaseDate), MONTH(PurchaseDate)
)
SELECT 
    m1.CustomerID, 
    m1.Freq AS CurrentMonthFreq, 
    m2.Freq AS PrevMonthFreq,
    (m1.Freq - m2.Freq) AS FreqChange
FROM MonthlyFreq m1
JOIN MonthlyFreq m2 ON m1.CustomerID = m2.CustomerID 
    AND m1.Yr = m2.Yr 
    AND m1.Mth = m2.Mth + 1
WHERE (m1.Freq - m2.Freq) < 0;

-- 17. Revenue Concentration (Pareto Principle: 80/20 Rule)
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

-- 18. First Product Purchased vs Subsequent Value
WITH FirstPurchase AS (
    SELECT 
        CustomerID, 
        Product AS FirstProduct,
        ROW_NUMBER() OVER(PARTITION BY CustomerID ORDER BY PurchaseDate ASC) as rn
    FROM Transactions
),
TotalValue AS (
    SELECT CustomerID, SUM(Sales) as LTV FROM Transactions GROUP BY CustomerID
)
SELECT 
    f.FirstProduct,
    AVG(t.LTV) AS AvgLifetimeValue
FROM FirstPurchase f
JOIN TotalValue t ON f.CustomerID = t.CustomerID
WHERE f.rn = 1
GROUP BY f.FirstProduct
ORDER BY AvgLifetimeValue DESC;

-- 19. Weekend vs Weekday Shopping Behavior
SELECT 
    CASE 
        WHEN DATEPART(dw, PurchaseDate) IN (1, 7) THEN 'Weekend' 
        ELSE 'Weekday' 
    END AS DayType,
    COUNT(OrderID) AS TotalTransactions,
    AVG(Sales) AS AvgTransactionValue
FROM Transactions
GROUP BY 
    CASE 
        WHEN DATEPART(dw, PurchaseDate) IN (1, 7) THEN 'Weekend' 
        ELSE 'Weekday' 
    END;

-- 20. Customer Acquisition Cost (CAC) vs LTV proxy (Assuming Marketing Spend table exists)
SELECT 
    m.Campaign,
    SUM(m.Spend) / COUNT(DISTINCT t.CustomerID) AS CAC,
    AVG(t.LTV) AS AvgLTV,
    AVG(t.LTV) / (SUM(m.Spend) / COUNT(DISTINCT t.CustomerID)) AS LTV_to_CAC_Ratio
FROM Marketing m
JOIN Transactions t ON m.Campaign = t.SourceCampaign
GROUP BY m.Campaign;

-- 21. Average Basket Size by Gender
SELECT 
    c.Gender,
    SUM(t.Quantity) * 1.0 / COUNT(t.OrderID) AS AvgBasketSize
FROM Customers c
JOIN Transactions t ON c.CustomerID = t.CustomerID
GROUP BY c.Gender;

-- 22. Returning Customers Reactivation (Bought after 180 days of inactivity)
WITH LastPurchase AS (
    SELECT 
        CustomerID, 
        PurchaseDate,
        LAG(PurchaseDate) OVER (PARTITION BY CustomerID ORDER BY PurchaseDate) as PreviousPurchase
    FROM Transactions
)
SELECT 
    CustomerID, 
    PreviousPurchase, 
    PurchaseDate AS ReactivationDate,
    DATEDIFF(day, PreviousPurchase, PurchaseDate) AS DaysInactive
FROM LastPurchase
WHERE DATEDIFF(day, PreviousPurchase, PurchaseDate) > 180;

-- 23. Cumulative Revenue by Segment
SELECT 
    Segment,
    PurchaseDate,
    SUM(Sales) OVER (PARTITION BY Segment ORDER BY PurchaseDate) AS CumulativeRevenue
FROM Transactions t
JOIN CustomerSegments cs ON t.CustomerID = cs.CustomerID;

-- 24. Most Popular Products by City
WITH CityProductRank AS (
    SELECT 
        c.City,
        t.Product,
        COUNT(t.OrderID) as TotalSold,
        RANK() OVER(PARTITION BY c.City ORDER BY COUNT(t.OrderID) DESC) as Rank
    FROM Customers c
    JOIN Transactions t ON c.CustomerID = t.CustomerID
    GROUP BY c.City, t.Product
)
SELECT City, Product, TotalSold
FROM CityProductRank
WHERE Rank = 1;

-- 25. Segment Migration (Month over Month Segment Changes)
WITH MonthlySegments AS (
    SELECT 
        CustomerID,
        FORMAT(PurchaseDate, 'yyyy-MM') AS Month,
        CASE 
            WHEN SUM(Sales) > 1000 THEN 'High Value'
            ELSE 'Low Value'
        END AS Segment
    FROM Transactions
    GROUP BY CustomerID, FORMAT(PurchaseDate, 'yyyy-MM')
)
SELECT 
    m1.Segment AS PreviousMonthSegment,
    m2.Segment AS CurrentMonthSegment,
    COUNT(m1.CustomerID) AS CustomerCount
FROM MonthlySegments m1
JOIN MonthlySegments m2 ON m1.CustomerID = m2.CustomerID 
    AND m2.Month = FORMAT(DATEADD(month, 1, CAST(m1.Month + '-01' AS DATE)), 'yyyy-MM')
GROUP BY m1.Segment, m2.Segment;
