import { errorResponse, successResponse } from "../utils/lambda-response";
import { queryUserStats } from "../utils/adaptor";
import wrap from "../utils/wrap";

export default wrap(async (event) => {
  const chain = event.pathParameters?.chain;
  if (!chain) return errorResponse({ message: "missing chain name" });

  let day = event.queryStringParameters?.day;
  day = day ? new Date(day) : new Date();

  let addresses = event.queryStringParameters?.addresses;
  if (!addresses) return errorResponse({ message: "missing addresses" });
  addresses = addresses.split(",").map((x) => Buffer.from(x.slice(2), "hex"));

  return successResponse(await queryUserStats(chain, day, addresses));
});
