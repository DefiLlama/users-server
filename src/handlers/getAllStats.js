import {
  queryStoredChainStats,
  queryAllProtocolsStats,
} from "../utils/wrappa/postgres/query";
import { successResponse } from "../utils/lambda-response";
import { SUPPORTED_CHAINS } from "../utils/constants";
import wrap from "../utils/wrap";

export default wrap(async (event) => {
  let day = event.queryStringParameters?.day;
  if (day) day = new Date(day);

  const chart = (
    await Promise.all(
      SUPPORTED_CHAINS.map((chain) => queryStoredChainStats(chain, { day }))
    )
  ).map((x, i) => x.map((y) => ({ ...y, chain: SUPPORTED_CHAINS[i] })));

  const protocols = await queryAllProtocolsStats({ day });

  return successResponse({ chains: SUPPORTED_CHAINS, chart, protocols });
});
