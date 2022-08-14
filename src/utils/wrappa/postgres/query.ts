import type { Chain } from "@defillama/sdk/build/general";

import { sql } from "../../db";

interface IUserStatsResponse {
  adaptor: string;
  day: Date;
  chain: Chain;
  sticky_users?: number;
  unique_users: number;
  total_users: number;
  new_users?: number;
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

const queryBlocksOnDay = async (
  chain: Chain,
  date: Date
): Promise<number[]> => {
  const nextDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const toTimestamp = Math.floor(nextDay.getTime() / 1000);
  const fromTimestamp = Math.floor(day.getTime() / 1000);

  return (
    await sql`
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
  return (
    await sql`
    SELECT
      count("user") AS "total_users",
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
    await sql`
    SELECT
      count("user") AS "total_users",
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

export {
  queryStoredUserStats,
  queryUserStats,
  queryBlocksOnDay,
  queryFunctionCalls,
};
