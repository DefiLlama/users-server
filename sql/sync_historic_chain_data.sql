WITH txs AS (
    SELECT
        date_trunc('day', "timestamp") AS "day",
        from_address AS "user"
    FROM
        avax.transactions
        INNER JOIN avax.blocks ON block_number = number
),
new_users AS (
    SELECT
        "day",
        count("user")
    FROM (
        SELECT
            min("day") AS "day",
        "user"
    FROM
        txs
    GROUP BY
        2) AS _
GROUP BY
    1)
/* Directly insert into `aggregate_data` */
INSERT INTO avax.aggregate_data
SELECT
    txs."day",
    NULL,
    count(DISTINCT "user"),
    count("user"),
    COALESCE(new_users.count, 0)
FROM
    txs
    LEFT JOIN new_users ON txs.day = new_users.day
GROUP BY
    1,
    5
ORDER BY
    1 DESC;
