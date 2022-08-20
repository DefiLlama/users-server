import { errorResponse, successResponse } from "../utils/lambda-response";
import { runAdaptor } from "../utils/adaptor";
import wrap from "../utils/wrap";

export default wrap(async (event) => {
  const exports = JSON.parse(event.body);
  const name = event.pathParameters.name;

  let day = event.queryStringParameters?.day;
  day = day ? new Date(day) : new Date();

  const warnings = [];
  const logger = (msg) => {
    warnings.push(msg);
    console.error(msg);
  };

  try {
    return successResponse({
      ...(await runAdaptor(name, day, {
        ignoreChainRugs: true,
        adaptorExports: exports,
        log: logger,
      })),
      warnings: warnings.join("\n"),
    });
  } catch (e) {
    return errorResponse({
      message: e.toString(),
      warnings: warnings.join("\n"),
    });
  }
});
