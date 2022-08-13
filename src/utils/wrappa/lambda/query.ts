import type { Chain } from "@defillama/sdk/build/general";

import fetch from "node-fetch";

declare const BASE_URL =
  "https://315jy324kl.execute-api.eu-central-1.amazonaws.com/prod";

const queryUserStatsLambda = async (
  chain: Chain,
  addresses: Buffer[],
  date: Date
) => {
  return (
    await fetch(
      `${BASE_URL}/run/adaptor/stats/${chain}?` +
        new URLSearchParams({
          addresses: addresses.map((x) => "0x" + x.toString("hex")),
          day: date.toISOString().substring(0, 10),
        })
    )
  ).json();
};

export { queryUserStatsLambda };
