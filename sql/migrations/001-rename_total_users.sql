ALTER TABLE users.aggregate_data RENAME COLUMN total_users TO total_txs;

DO $$
DECLARE
    _chain varchar;
BEGIN
    FOR _chain IN
    SELECT
        chain
    FROM
        chains LOOP
            EXECUTE format('ALTER TABLE %s.aggregate_data 
                        RENAME COLUMN total_users TO total_txs', _chain);
        END LOOP;
END
$$;
