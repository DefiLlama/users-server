import { queryStoredChainStats } from "../utils/wrappa/postgres/query";
import { successResponse } from "../utils/lambda-response";
import wrap from "../utils/wrap";

export default wrap(async (event) => {
  const chain = event.pathParameters.chain;

  let day = event.queryStringParameters?.day;
  if (day) day = new Date(day);

  return successResponse(await queryStoredChainStats(chain, { day }));
});
