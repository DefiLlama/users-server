import type { Chain } from "@defillama/sdk/build/general";

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
        all: MaybePromiseFunction<string[]>;
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
  const values = Object.entries(data).flatMap(([chain, _x]) =>
    Object.entries(_x).map(([column, stats]) => {
      return { adaptor, day, chain, column_type: column, ...stats };
    })
  );

  return writeableSql`INSERT INTO users.aggregate_data ${writeableSql(values)}`;
};

const runAdaptor = async (
  name: string,
  date: Date,
  { storeData } = { storeData: false }
): Promise<Record<Chain, Record<string, IUserStats>>> => {
  const adaptor: AdaptorExport = (await import(`./../adaptors/${name}`))
    .default;

  const promises: Promise<any>[] = [];
  const chains = Object.keys(adaptor).filter(
    (x) => x !== "category"
  ) as Chain[];
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const exportKeys: string[] | undefined =
    CATEGORY_USER_EXPORTS?.[
      adaptor.category as keyof typeof CATEGORY_USER_EXPORTS
    ];

  await asyncForEach(chains, async (chain) => {
    const blocks = await queryBlocksOnDay(chain, day);
    if (blocks.length == 0)
      throw new Error(`db rugged for date ${day} for chain ${chain}`);

    const userExports = adaptor[chain];

    if (exportKeys !== undefined && typeof userExports.all !== "function") {
      promises.push(
        Promise.all(
          exportKeys.flatMap((key) => {
            const exports = userExports[
              key as keyof typeof userExports
            ] as IFunctionCall;

            return queryFunctionCalls(
              chain,
              addressToPSQLNative(exports.address),
              exports.functionNames,
              blocks
            );
          })
        )
      );
    } else {
      if (typeof userExports.all !== "function")
        throw new Error(`incorrect exports: ${userExports} for ${adaptor}`);

      // Either the `category` is not set or `all` is set.
      const addresses = (await userExports.all()).map((x) =>
        addressToPSQLNative(x)
      );

      promises.push(
        process.env.MODE === "lambda"
          ? queryUserStats(chain, addresses, blocks)
          : queryUserStatsLambda(chain, addresses, day)
      );
    }
  });

  const resolved = await Promise.all(promises);

  const res = Object.fromEntries(
    resolved.map((chainData, i) => {
      if (exportKeys !== undefined && Array.isArray(chainData)) {
        return [
          chains[i],
          Object.fromEntries(
            exportKeys.map((key, j) => {
              if (!chainData[j])
                return [key, { total_users: 0, unique_users: 0 }];

              return [key, chainData[j]];
            })
          ),
        ];
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

/* 
(async () => {
  console.log(
    await runAdaptor("sushiswap", new Date("2022-07-22"), { storeData: false })
  );
  await sql.end({ timeout: 5 });
  await writeableSql.end({ timeout: 5 });
  process.exit();
})(); */

export { runAdaptor };
