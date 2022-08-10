import type { Chain } from "@defillama/sdk/build/general";

import sql from "./db";

interface IUserStatsResponse {
  adaptor: string;
  day: Date;
  chain: Chain;
  sticky_users?: number;
  unique_users: number;
  total_users: number;
  new_users?: number;
}

const queryUserStats = async (
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

export { queryUserStats };
