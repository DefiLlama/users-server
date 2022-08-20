#!/usr/bin/env node
import { runAdaptorLambda } from "./src/utils/wrappa/lambda/adaptor";
import { asyncForEach } from "./src/utils/adaptor";

(async () => {
  if (process.argv.length < 3) {
    console.error(`Missing argument, you need to provide the filename of the adapter to test.
      Eg: npm run test YOUR_ADAPTOR`);
    process.exit(1);
  }

  const yesterday = new Date(Date.now() - 864e5);
  const _3daysago = new Date(Date.now() - 864e5 * 3);
  const _10daysago = new Date(Date.now() - 864e5 * 10);
  const _50daysago = new Date(Date.now() - 864e5 * 50);
  const days = [yesterday, _3daysago, _10daysago, _50daysago];

  const exports = (await import(`./src/adaptors/${process.argv[2]}`)).default;

  // Resolve all function calls due to passing data to lambda. No RCE today!
  await asyncForEach(Object.keys(exports), async (chain) => {
    if (chain === "category") return;

    const adaptorExport = exports[chain];

    if (typeof adaptorExport.all === "undefined")
      throw new Error(
        `${process.argv[2]} does not export an 'all' key for ${chain}`
      );

    exports[chain].all = await adaptorExport.all();
  });

  const res = await Promise.all([
    runAdaptorLambda(process.argv[2], yesterday, exports),
    runAdaptorLambda(process.argv[2], _3daysago, exports),
    runAdaptorLambda(process.argv[2], _10daysago, exports),
    runAdaptorLambda(process.argv[2], _50daysago, exports),
  ]);

  res.forEach((userStats, i) => {
    const day = days[i].toDateString();

    if (typeof userStats.warnings === "string") {
      console.log(userStats.warnings);
      delete userStats.warnings;
    }

    if (userStats.message !== undefined)
      return console.error(userStats.message);

    console.log(`------ ${day} ------\n`);
    for (const [chain, stats] of Object.entries(userStats)) {
      console.log(`--- ${chain} ---`);
      for (const [column, data] of Object.entries(stats)) {
        console.log(`- ${column} -`);
        console.log(" Total Users".padEnd(25, " "), data.total_users);
        console.log(" Unique Users".padEnd(25, " "), data.unique_users);
      }
    }
  });

  process.exit(0);
})();
