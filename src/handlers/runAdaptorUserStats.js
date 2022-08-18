import { errorResponse, successResponse } from "../utils/lambda-response";
import { runAdaptor } from "../utils/adaptor";
import wrap from "../utils/wrap";

export default wrap(async (event) => {
  const exports = JSON.parse(event.body);
  const name = event.pathParameters.name;

  let day = event.queryStringParameters?.day;
  day = day ? new Date(day) : new Date();

  try {
    return successResponse(
      await runAdaptor(name, day, {
        ignoreChainRugs: true,
        adaptorExports: exports,
      })
    );
  } catch (e) {
    return errorResponse({
      message: e.toString(),
    });
  }
});
