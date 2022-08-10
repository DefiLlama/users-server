import type { Chain } from "@defillama/sdk/build/general";

import fetch from "node-fetch";

import sql from "./db";

type MaybePromise<T> = T | Promise<T>;
export declare type AdaptorExport = Record<Chain, () => MaybePromise<string[]>>;

interface IUserStats {
  day: Date;
  total_users: number;
  unique_users: number;
}

const asyncForEach = async <T = any>(
  array: T[],
  callback: (value: T, index?: number, array?: T[]) => any
): Promise<any[]> => {
  const data: any[] = [];

  for (let index = 0; index < array.length; index++) {
    await (async () => {
      const item = await callback(array[index], index, array);

      if (item !== undefined) data.push(item);
    })();
  }

  return Promise.resolve(data);
};

const queryUserStatsSql = (_chain: Chain, date: Date, addresses: Buffer[]) => {
  const nextDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // @ts-ignore
  const toTimestamp = Math.floor(nextDay / 1000);
  // @ts-ignore
  const fromTimestamp = Math.floor(day / 1000);

  const chain = _chain === "avax" ? "avalanche" : _chain;

  return sql`
    WITH blocks AS (
      SELECT
        timestamp,
        number
      FROM
        ${sql(chain)}.blocks
      WHERE
        timestamp < to_timestamp(${toTimestamp})
        AND timestamp >= to_timestamp(${fromTimestamp})
    ),
    txs AS (
      SELECT
        from_address AS "user",
        timestamp
      FROM
        ${sql(chain)}.transactions
        INNER JOIN blocks ON number = block_number
      WHERE
        to_address IN ${sql(addresses)}
        AND success
    )
    SELECT
      date_trunc('day', timestamp) AS "day",
      count("user") AS "total_users",
      count(DISTINCT "user") AS "unique_users"
    FROM
      txs
    GROUP BY
      1
    `;
};

const queryUserStatsLambda = async (
  chain: Chain,
  date: Date,
  addresses: Buffer[]
) => {
  return (
    await fetch(
      `https://315jy324kl.execute-api.eu-central-1.amazonaws.com/prod/run/adaptor/stats/${chain}?` +
        new URLSearchParams({
          addresses: addresses.map((x) => "0x" + x.toString("hex")),
          day: date.toISOString().substring(0, 10),
        })
    )
  ).json();
};

const storeUserStats = async (
  adaptor: string,
  data: { [k: string]: Record<string, string> }
) => {
  const values = Object.entries(data).map((x) =>
    Object.assign({ adaptor, chain: x[0] }, x[1])
  );

  return sql`INSERT INTO users.aggregate_data ${sql(values)}`;
};

const runAdaptor = async (
  name: string,
  date: Date,
  { storeData } = { storeData: false }
): Promise<Record<Chain, IUserStats>> => {
  const adaptor: AdaptorExport = (await import(`./../adaptors/${name}`))
    .default;

  const promises: Promise<any>[] = [];
  const chains = Object.keys(adaptor) as Chain[];
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  await asyncForEach(chains, async (chain) => {
    // TODO(blaze): validate addresses
    const addresses = (await adaptor[chain]()).map((x) =>
      Buffer.from(x.slice(2), "hex")
    );

    promises.push(queryUserStats(chain, date, addresses));
  });

  const resolved = await Promise.all(promises);
  const res = Object.fromEntries(
    chains.map((_, i) => {
      // Return a default value.
      if (!resolved[i][0])
        return [chains[i], { day, total_users: 0, unique_users: 0 }];

      return [chains[i], resolved[i][0]];
    })
  );

  if (storeData) await storeUserStats(name, res);

  // Fix to make sure types are what we expect them to be,
  Object.values(res).map((data) => {
    data.unique_users = Number(data.unique_users);
    data.total_users = Number(data.total_users);
    data.day = new Date(data.day);
  });

  return res as Record<Chain, IUserStats>;
};

const queryUserStats = (chain: Chain, day: Date, addresses: Buffer[]) => {
  return process.env.MODE === "lambda"
    ? queryUserStatsSql(chain, day, addresses)
    : queryUserStatsLambda(chain, day, addresses);
};

/*
(async () => {
  console.log(await runAdaptor("llamapay", new Date("2022-07-01")));
  await sql.end({ timeout: 5 });
  process.exit();
})(); */

export { runAdaptor, queryUserStats };
