import type { Chain } from "@defillama/sdk/build/general";
import { SUPPORTED_CHAINS } from "../../constants";

import sql from "../../db";

interface IUserStatsResponse {
  adaptor: string;
  day: Date;
  chain: Chain;
  sticky_users?: number;
  unique_users: number;
  total_txs: number;
  new_users?: number;
}

interface IUserStats {
  total_txs: number;
  unique_users: number;
}

interface IProtocolStats {
  adaptor: string;
  "24hourTxs": number;
  "24hourUsers": number;
  change_1d: number; // signed float
}

interface IChainStatsResponse {
  day: Date;
  sticky_users?: number;
  unique_users: number;
  total_txs: number;
  new_users: number;
}

const queryStoredUserStats = async (
  adaptor: string,
  { day, chain }: { day?: Date; chain?: Chain }
) => {
  return sql<IUserStatsResponse[]>`
    SELECT * FROM
      users.aggregate_data
    WHERE 
      adaptor = ${adaptor}
    ${day ? sql`AND day=${day}` : sql``}
    ${chain ? sql`AND chain=${chain}` : sql``}
  `;
};

const queryBlocksOnDay = async (chain: Chain, date: Date) => {
  const nextDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)
  );
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

  const toTimestamp = Math.floor(nextDay.getTime() / 1000);
  const fromTimestamp = Math.floor(day.getTime() / 1000);

  return (
    await sql<{ number: number }[]>`
      SELECT
        number::integer
      FROM
        ${sql(chain)}.blocks
      WHERE
        timestamp < to_timestamp(${toTimestamp})
        AND timestamp >= to_timestamp(${fromTimestamp})
  `
  ).map((x) => x.number);
};

const queryFunctionCalls = async (
  chain: Chain,
  address: Buffer,
  functionNames: string[],
  blocks: number[]
) => {
  // No functionNames means we cannot match anything, hence 0 users.
  if (functionNames.length == 0)
    return {
      total_txs: 0,
      unique_users: 0,
    } as IUserStats;

  return (
    await sql<IUserStats[]>`
    SELECT
      count("user") AS "total_txs",
      count(DISTINCT "user") AS "unique_users"
    FROM (
      SELECT
        from_address as "user"
      FROM unnest(${sql.array(blocks)}::bigint[]) blocks
      INNER JOIN ${sql(chain)}.transactions ON block_number = blocks
      WHERE
        input_function_name IN ${sql(functionNames)}
        AND to_address = ${address}
        AND success
    ) AS _
  `
  )[0];
};

const queryUserStats = async (
  chain: Chain,
  addresses: Buffer[],
  blocks: number[]
) => {
  return (
    await sql<IUserStats[]>`
    SELECT
      count("user") AS "total_txs",
      count(DISTINCT "user") AS "unique_users"
    FROM (
      SELECT
          from_address AS "user"
      FROM
        unnest(${sql.array(blocks)}::bigint[]) blocks
      INNER JOIN ${sql(chain)}.transactions ON block_number = blocks
      WHERE
        to_address IN ${sql(addresses)}
        AND success
    ) AS _ 
    `
  )[0];
};

const queryMissingFunctionNames = async (
  chain: Chain,
  addresses: Buffer[],
  blocks: number[]
) => {
  return +(
    await sql<{ count: number }[]>`
    SELECT
      count(*)
    FROM
      unnest(${sql.array(blocks)}::bigint[]) blocks
      INNER JOIN ${sql(chain)}.transactions ON block_number = blocks
    WHERE
      to_address IN ${sql(addresses)}
      AND input_function_name IS NULL
      AND success
  `
  )[0].count;
};

const queryStoredChainStats = async (chain: Chain, { day }: { day?: Date }) => {
  return sql<IChainStatsResponse[]>`
    SELECT * FROM
      ${sql(chain)}.aggregate_data
    ${day ? sql`WHERE day=${day}` : sql``}
  `;
};

const queryStoredManyChainsStats = () => {
  const query = SUPPORTED_CHAINS.map(
    (chain) => `SELECT * FROM ${chain}.aggregate_data`
  ).join(" UNION ALL ");

  return sql.unsafe<IChainStatsResponse[]>(query);
};

const queryAllProtocolsStats = ({
  chain,
  day,
}: {
  chain?: Chain;
  day?: Date;
}) => {
  // We update all adaptors at 00:00 UTC for the day before's data, so latest
  // data for adaptors will always be yesterday (1 day time lag).
  day = day ? day : new Date(Date.now() - 864e5);

  // TODO: Optimization of the query may be needed.
  return sql<IProtocolStats[]>`
    WITH today AS (
      SELECT
        adaptor,
        sum(total_txs) AS total_txs,
        sum(unique_users) AS unique_users
      FROM
        users.aggregate_data
      WHERE
        column_type = 'all'
        ${chain ? sql`AND chain=${chain}` : sql``}
        AND day = ${day}::date
      GROUP BY
        adaptor
    ),
    yesterday AS (
      SELECT
        adaptor,
        sum(total_txs) AS total_txs
      FROM
        users.aggregate_data
      WHERE
        column_type = 'all'
        ${chain ? sql`AND chain=${chain}` : sql``}
        AND day = ${day}::date - interval '1 day'
      GROUP BY
        adaptor
    )

    SELECT
      t.adaptor,
      t.total_txs AS "24hourTxs",
      t.unique_users AS "24hoursUsers",
      y.total_txs,
      CASE
        WHEN y.total_txs = 0
          THEN t.total_txs
        ELSE
          (t.total_txs - y.total_txs)::float / y.total_txs * 100
      END AS change_1d
    FROM
      today t
      LEFT JOIN yesterday y ON t.adaptor = y.adaptor
  `;
};

export {
  queryStoredUserStats,
  queryUserStats,
  queryBlocksOnDay,
  queryFunctionCalls,
  queryMissingFunctionNames,
  queryStoredChainStats,
  queryAllProtocolsStats,
  queryStoredManyChainsStats,
};
