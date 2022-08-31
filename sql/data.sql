CREATE SCHEMA IF NOT EXISTS users;

CREATE TABLE IF NOT EXISTS users.aggregate_data (
    adaptor varchar NOT NULL,
    day date NOT NULL,
    chain varchar NOT NULL,
    column_type varchar DEFAULT 'all',
    sticky_users integer,
    unique_users integer,
    total_txs integer,
    new_users integer,
    PRIMARY KEY (adaptor, column_type, chain, day)
);

CREATE INDEX IF NOT EXISTS aggregate_data_adaptor_idx ON users.aggregate_data (adaptor);

CREATE TABLE IF NOT EXISTS ethereum.aggregate_data (
    day date PRIMARY KEY,
    sticky_users integer,
    unique_users integer,
    total_txs integer,
    new_users integer
);

DO $$
DECLARE
    _chains varchar := (
        SELECT
            string_agg(chain, ',')
        FROM
            chains
        WHERE
            chain != 'ethereum'
            AND is_evm);
BEGIN
    PERFORM
        cp_table_schema_many ('ethereum', 'aggregate_data', _chains);
END
$$;
