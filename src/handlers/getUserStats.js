import { queryStoredUserStats } from "../utils/wrappa/postgres/query";
import { successResponse } from "../utils/lambda-response";
import { wrap } from "../utils/wrap";

export default wrap(async (event) => {
  const adaptor = event.pathParameters.adaptor;
  const chain = event.queryStringParameters?.chain;

  let day = event.queryStringParameters?.day;
  if (day) day = new Date(day);

  return successResponse(await queryStoredUserStats(adaptor, { day, chain }));
});
