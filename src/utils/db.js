import postgres from "postgres";

const sql = postgres(
  process.env.MODE === "lambda" ? process.env.PSQL_URL : undefined,
  {
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  }
);

export default sql;
