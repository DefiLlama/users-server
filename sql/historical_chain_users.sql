WITH txs AS (
    SELECT
        date_trunc('day', "timestamp") AS "day",
        from_address AS "user"
    FROM
        ethereum.transactions
        INNER JOIN ethereum.blocks ON block_number = number
),
/*
weekly_users AS (
 SELECT
 date_trunc('week', "day"::timestamp) AS "week",
 "user"
 FROM
 txs
 GROUP BY
 1,
 2
), */
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
    1
)
SELECT
    txs."day",
    count("user") AS "total users",
    count(DISTINCT "user") AS "unique users",
    /*count(
     CASE WHEN "user" IN (
     SELECT
     "user"
     FROM weekly_users
     WHERE
     week = (date_trunc('week', txs."day"::timestamp) -
     interval '1 week')) THEN
     1
     ELSE
     NULL
     END) AS "sticky users", */
    COALESCE(new_users.count, 0) AS "new users"
FROM
    txs
    LEFT JOIN new_users ON txs.day = new_users.day
GROUP BY
    1,
    4
ORDER BY
    1 DESC;
