
WITH first_set AS (
    SELECT * FROM AvailablePlots WHERE available = 1 AND depth = 0 ORDER BY RANDOM() LIMIT 10
),
second_set AS (
    SELECT * FROM AvailablePlots WHERE available = 1 AND depth = 1 ORDER BY RANDOM() LIMIT 10
)
SELECT * FROM first_set
UNION ALL
SELECT * FROM second_set;
