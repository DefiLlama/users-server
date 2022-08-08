CREATE SCHEMA IF NOT EXISTS users;

CREATE TABLE IF NOT EXISTS users.aggregate_data (
    adaptor varchar NOT NULL,
    day date NOT NULL,
    chain varchar NOT NULL,
    sticky_users integer,
    unique_users integer,
    total_users integer,
    new_users integer,
    PRIMARY KEY (adaptor, chain, day)
);

CREATE INDEX IF NOT EXISTS aggregate_data_adaptor_idx ON users.aggregate_data (adaptor);
