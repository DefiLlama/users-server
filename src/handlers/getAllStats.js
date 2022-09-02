import {
  queryStoredManyChainsStats,
  queryAllProtocolsStats,
} from "../utils/wrappa/postgres/query";
import { successResponse } from "../utils/lambda-response";
import { SUPPORTED_CHAINS } from "../utils/constants";
import wrap from "../utils/wrap";

export default wrap(async (event) => {
  let day = event.queryStringParameters?.day;
  if (day) day = new Date(day);

  const [chart, protocols] = await Promise.all([
    queryStoredManyChainsStats(SUPPORTED_CHAINS),
    queryAllProtocolsStats({ day }),
  ]);

  return successResponse({ chains: SUPPORTED_CHAINS, chart, protocols });
});
