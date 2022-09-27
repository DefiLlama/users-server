import type { Chain } from "@defillama/sdk/build/general";

import { getProvider } from "@defillama/sdk/build/general";

import {
  queryBlocksOnDay,
  queryFunctionCalls,
  queryMissingFunctionNames,
} from "./wrappa/postgres/query";
import { CATEGORY_USER_EXPORTS } from "../helpers/categories";
import { queryUserStats } from "./wrappa/postgres/query";
import { addressToPSQLNative } from "./address";
import sql from "./db";

interface IFunctionCall {
  chain: Chain;
  address: string;
  functionNames: string[];
  blocks: number[];
}

type MaybePromiseFunction<T> = () => T | Promise<T>;
export declare type AdaptorExport = {
  [k in Chain]: { [u: string]: IFunctionCall } & {
    all: MaybePromiseFunction<string[]> | string[];
  };
} & { category: string };

interface IUserStats {
  total_txs: number;
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

  return sql`INSERT INTO users.aggregate_data ${sql(values)}`;
};

const verifyBlocks = async (chain: Chain, day: Date, blocks: number[]) => {
  const provider = getProvider(chain);

  // Newest block is the latest (the first in the array) due to the ordering
  // of the block index in the PostgreSQL database.
  const minBlock = blocks[blocks.length - 1];
  const maxBlock = blocks[0];

  if (maxBlock < minBlock)
    throw new Error(`${chain}: ${maxBlock} and ${minBlock} wrong order?`);

  const [minRes, maxRes] = (
    await Promise.all([
      provider.getBlock(minBlock),
      provider.getBlock(maxBlock),
    ])
  ).map((x) => x.timestamp);

  if (maxRes < minRes)
    throw new Error(
      `${chain}: ${maxBlock} and ${minBlock} wrong order for timestamp?`
    );

  const nextDay = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + 1)
  );

  const toTimestamp = Math.floor(nextDay.getTime() / 1000);
  const fromTimestamp = Math.floor(day.getTime() / 1000);
  const threshold = 60; // Max 60s deviation from expected timestamps.

  if (toTimestamp < maxRes || fromTimestamp > minRes)
    throw new Error(
      `${chain}: ${minRes} ${maxBlock} are invalid comp to ${fromTimestamp} ${toTimestamp}`
    );
  else if (toTimestamp - maxRes > threshold)
    throw new Error(`${chain}: UB ${toTimestamp} vs ${maxRes} above threshold`);
  else if (minRes - fromTimestamp > threshold)
    throw new Error(
      `${chain}: LB ${fromTimestamp} vs ${minRes} above threshold`
    );
};

const runAdaptor = async (
  name: string,
  date: Date,
  {
    storeData = false,
    ignoreChainRugs = false,
    adaptorExports = false,
    log = console.error,
  } = {}
): Promise<Record<Chain, Record<string, IUserStats>>> => {
  const adaptor: AdaptorExport = adaptorExports
    ? adaptorExports
    : (await import(`./../adaptors/${name}`)).default;

  const chains = Object.keys(adaptor).filter(
    (x) => x !== "category"
  ) as Chain[];
  const exportKeys: string[] =
    CATEGORY_USER_EXPORTS?.[
      adaptor.category as keyof typeof CATEGORY_USER_EXPORTS
    ] || [];
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const promises: Promise<any>[] = [];

  await asyncForEach(chains, async (chain) => {
    const blocks = await queryBlocksOnDay(chain, day);
    if (blocks.length == 0) {
      const msg = `db rugged for date ${day} for chain ${chain}`;

      if (ignoreChainRugs) return log(msg);
      else throw new Error(msg);
    }

    // Verify we are not missing a huge chunk of blocks, this may happen if
    // the indexer is behind or just has not fully indexed that day.
    if (ignoreChainRugs) {
      try {
        await verifyBlocks(chain, day, blocks);
      } catch (e) {
        return log(e);
      }
    } else {
      await verifyBlocks(chain, day, blocks);
    }

    let pushedProm = false;
    let prom: Promise<any>;
    let addresses: Buffer[];

    const userExports = adaptor[chain];
    if (exportKeys.length == Object.keys(userExports).length + 1)
      throw new Error(
        `${name} does not export correct amount of keys, expected: ${exportKeys}
        got: ${JSON.stringify(userExports)}
        `
      );

    if (typeof userExports.all === "undefined")
      throw new Error(`${name} does not export an 'all' key for ${chain}`);
    else if (typeof userExports.all === "function")
      addresses = (await userExports.all()).map((x) => addressToPSQLNative(x));
    else addresses = userExports.all.map((x) => addressToPSQLNative(x));

    const missingFns = await queryMissingFunctionNames(
      chain,
      addresses,
      blocks
    );

    if (missingFns !== 0) {
      log(`${name} has ${missingFns} missing decoded txs on ${chain}.`);
      log(
        `This MAY affect categorized user metrics (if you rely on 'functionNames')\n`
      );

      // TODO: throw err?
      // Does exports rely on 'functionNames'?
      // if (Object.keys(userExports).length > 1 && storeData)
    }

    prom = queryUserStats(chain, addresses, blocks);

    if (exportKeys !== undefined && Object.keys(userExports).length > 1) {
      const proms = exportKeys.flatMap((key) => {
        if (key === "all") return;

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

      proms.push(prom!);
      pushedProm = true;

      promises.push(Promise.all(proms));
    }

    if (!pushedProm) promises.push(Promise.all([prom!]));
  });

  if (promises.length === 0) throw new Error(`adaptor ${name} rugged exports`);

  const resolved = await Promise.all(promises);

  const res = Object.fromEntries(
    resolved.map((chainData, i) => {
      if (exportKeys !== undefined && Array.isArray(chainData)) {
        // Hack to make deep copy of `exportKeys`.
        let keys: string[] = JSON.parse(JSON.stringify(exportKeys));

        if (chainData.length > exportKeys.length + 1)
          throw new Error(
            `incorrect export lengths: ${resolved}, expected: ${exportKeys.length}`
          );
        else if (chainData.length == exportKeys.length + 1)
          // The `all` export is always last in the promise array.
          keys.push("all");

        const map = keys.map((key, j) => {
          if (!chainData[j]) return [key, { total_txs: 0, unique_users: 0 }];

          return [key, chainData[j]];
        });

        return [chains[i], Object.fromEntries(map)];
      } else {
        return [
          chains[i],
          { all: chainData || { total_txs: 0, unique_users: 0 } },
        ];
      }
    })
  ) as Record<Chain, Record<string, IUserStats>>;

  // Fix to make sure types are what we expect them to be,
  Object.values(res).map((x) =>
    Object.values(x).map((data) => {
      data.unique_users = Number(data.unique_users);
      data.total_txs = Number(data.total_txs);
    })
  );

  if (storeData) await storeUserStats(name, res, day);

  return res as Record<Chain, Record<string, IUserStats>>;
};

/*
(async () => {
  console.log(
    await runAdaptor("sushiswap", new Date("2022-06-21"), {
      storeData: false,
      ignoreChainRugs: true,
    })
  );
  await writeableSql.end({ timeout: 5 });
  process.exit();
})(); */

export { runAdaptor, asyncForEach };
