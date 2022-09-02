import {
  queryStoredChainStats,
  queryAllProtocolsOnChainStats,
} from "../utils/wrappa/postgres/query";
import { successResponse } from "../utils/lambda-response";
import wrap from "../utils/wrap";

export default wrap(async (event) => {
  const chain = event.pathParameters.chain;

  let day = event.queryStringParameters?.day;
  if (day) day = new Date(day);

  const [chart, protocols] = await Promise.all([
    queryStoredChainStats(chain, { day }),
    queryAllProtocolsOnChainStats(chain, { day }),
  ]);

  return successResponse({ chart, protocols });
});
