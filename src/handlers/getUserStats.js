import { errorResponse, successResponse } from "../utils/lambda-response";
import { queryUserStats } from "../utils/query";
import wrap from "../utils/wrap";

export default wrap(async (event) => {
  const adaptor = event.pathParameters?.adaptor;
  if (!adaptor) return errorResponse({ message: "missing adaptor name" });

  const chain = event.queryStringParameters?.chain;

  let day = event.queryStringParameters?.day;
  if (day) day = new Date(day);

  return successResponse(await queryUserStats(adaptor, { day, chain }));
});
