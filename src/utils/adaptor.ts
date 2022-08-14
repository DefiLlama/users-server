import type { Chain } from "@defillama/sdk/build/general";

import { getProvider } from "@defillama/sdk/build/general";

import { queryBlocksOnDay, queryFunctionCalls } from "./wrappa/postgres/query";
import { CATEGORY_USER_EXPORTS } from "../helpers/categories";
import { queryUserStatsLambda } from "./wrappa/lambda/query";
import { queryUserStats } from "./wrappa/postgres/query";
import { addressToPSQLNative } from "./address";
import { writeableSql } from "./db";

interface IFunctionCall {
  chain: Chain;
  address: string;
  functionNames: string[];
  blocks: number[];
}

type MaybePromiseFunction<T> = () => T | Promise<T>;
export declare type AdaptorExport = {
  [k in Chain]:
    | { [u: string]: IFunctionCall }
    | {
        all?: MaybePromiseFunction<string[]>;
      };
} & { category: string };

interface IUserStats {
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

const storeUserStats = async (
  adaptor: string,
  data: Record<Chain, Record<string, IUserStats>>,
  day: Date
) => {
  let allKeyExists = false;

  const values = Object.entries(data).flatMap(([chain, _x]) =>
    Object.entries(_x).map(([column, stats]) => {
      if (column === "all") allKeyExists = true;

      return { adaptor, day, chain, column_type: column, ...stats };
    })
  );

  if (!allKeyExists) throw new Error(`${adaptor} does not export an 'all' key`);

  return writeableSql`INSERT INTO users.aggregate_data ${writeableSql(values)}`;
};

const verifyBlocks = async (chain: Chain, day: Date, blocks: number[]) => {
  const provider = getProvider(chain);

  // Newest block is the latest (the first in the array) due to the ordering
  // of the block index in the PostgreSQL database.
  const minBlock = blocks[blocks.length - 1];
  const maxBlock = blocks[0];

  if (maxBlock < minBlock)
    throw new Error(`${maxBlock} and ${minBlock} wrong order?`);

  const [minRes, maxRes] = (
    await Promise.all([
      provider.getBlock(minBlock),
      provider.getBlock(maxBlock),
    ])
  ).map((x) => x.timestamp);

  if (maxRes < minRes)
    throw new Error(`${maxBlock} and ${minBlock} wrong order for timestamp?`);

  const nextDay = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate() + 1
  );

  const toTimestamp = Math.floor(nextDay.getTime() / 1000);
  const fromTimestamp = Math.floor(day.getTime() / 1000);
  const threshold = 30; // Max 30s deviation from expected timestamps.

  if (toTimestamp < maxRes || fromTimestamp > minRes)
    throw new Error(
      `${minRes} ${maxBlock} are invalid comp to ${fromTimestamp} ${toTimestamp}`
    );
  else if (toTimestamp - maxRes > threshold)
    throw new Error(`UB ${toTimestamp} vs ${maxRes} above threshold`);
  else if (minRes - fromTimestamp > threshold)
    throw new Error(`LB ${minRes} vs ${minRes} above threshold`);
};
const runAdaptor = async (
  name: string,
  date: Date,
  { storeData } = { storeData: false }
): Promise<Record<Chain, Record<string, IUserStats>>> => {
  const adaptor: AdaptorExport = (await import(`./../adaptors/${name}`))
    .default;

  const chains = Object.keys(adaptor).filter(
    (x) => x !== "category"
  ) as Chain[];
  const exportKeys: string[] | undefined =
    CATEGORY_USER_EXPORTS?.[
      adaptor.category as keyof typeof CATEGORY_USER_EXPORTS
    ];
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const promises: Promise<any>[] = [];

  await asyncForEach(chains, async (chain) => {
    const blocks = await queryBlocksOnDay(chain, day);
    if (blocks.length == 0)
      return console.error(`db rugged for date ${day} for chain ${chain}`);
    // throw new Error(`db rugged for date ${day} for chain ${chain}`);

    // Verify we are not missing a huge chunk of blocks, this may happen if
    // the indexer is behind or just has not fully indexed that day.
    await verifyBlocks(chain, day, blocks);

    let exportsAllKey = false;
    let prom: Promise<any>;

    const userExports = adaptor[chain];
    if (exportKeys.length == Object.keys(userExports).length + 1)
      throw new Error(
        `${name} does not export correct amount of keys, expected: ${exportKeys}
        got: ${JSON.stringify(userExports)}
        `
      );

    if (typeof userExports.all === "function") {
      const addresses = (await userExports.all()).map((x) =>
        addressToPSQLNative(x)
      );

      prom =
        process.env.MODE === "lambda"
          ? queryUserStats(chain, addresses, blocks)
          : queryUserStatsLambda(chain, addresses, day);

      delete userExports.all;
      exportsAllKey = true;
    }

    if (exportKeys !== undefined && Object.keys(userExports).length > 1) {
      const proms = exportKeys.flatMap((key) => {
        const exports = userExports[
          key as keyof typeof userExports
        ] as IFunctionCall;

        return queryFunctionCalls(
          chain,
          addressToPSQLNative(exports.address),
          exports.functionNames,
          blocks
        );
      });

      if (exportsAllKey) {
        exportsAllKey = false;
        proms.push(prom!);
      }

      promises.push(Promise.all(proms));
    }

    if (exportsAllKey) promises.push(prom!);
  });

  if (promises.length === 0) throw new Error(`adaptor ${name} rugged exports`);

  const resolved = await Promise.all(promises);

  const res = Object.fromEntries(
    resolved.map((chainData, i) => {
      if (exportKeys !== undefined && Array.isArray(chainData)) {
        let keys = exportKeys;

        if (chainData.length > exportKeys.length + 1)
          throw new Error(
            `incorrect export lengths: ${resolved}, expected: ${exportKeys.length}`
          );
        else if (chainData.length == exportKeys.length + 1)
          // The `all` export is always last in the promise array.
          keys.push("all");

        const map = keys.map((key, j) => {
          if (!chainData[j]) return [key, { total_users: 0, unique_users: 0 }];

          return [key, chainData[j]];
        });

        return [chains[i], Object.fromEntries(map)];
      } else {
        return [
          chains[i],
          { all: chainData || { total_users: 0, unique_users: 0 } },
        ];
      }
    })
  ) as Record<Chain, Record<string, IUserStats>>;

  // Fix to make sure types are what we expect them to be,
  Object.values(res).map((x) =>
    Object.values(x).map((data) => {
      data.unique_users = Number(data.unique_users);
      data.total_users = Number(data.total_users);
    })
  );

  if (storeData) await storeUserStats(name, res, day);

  return res as Record<Chain, Record<string, IUserStats>>;
};

(async () => {
  console.log(
    await runAdaptor("sushiswap", new Date("2022-06-21"), { storeData: true })
  );
  await writeableSql.end({ timeout: 5 });
  process.exit();
})();

export { runAdaptor };
