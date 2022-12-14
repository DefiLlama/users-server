import type { Chain } from "@defillama/sdk/build/general";

import type { AdaptorExport } from "../../adaptor";

import fetch from "node-fetch";

const BASE_URL =
  "https://6tklng2o7b.execute-api.eu-central-1.amazonaws.com/prod";

const runAdaptorLambda = async (
  name: string,
  date: Date,
  exports: AdaptorExport
) => {
  return (
    await fetch(
      `${BASE_URL}/run/adaptor/stats/${name}?` +
        new URLSearchParams({
          day: date.toISOString().substring(0, 10),
        }),
      {
        method: "POST",
        body: JSON.stringify(exports),
      }
    )
  ).json();
};

export { runAdaptorLambda };
