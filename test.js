#!/usr/bin/env node
import { runAdaptor } from "./src/utils/adaptor";

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

  const res = await Promise.all([
    runAdaptor(process.argv[2], yesterday),
    runAdaptor(process.argv[2], _3daysago),
    runAdaptor(process.argv[2], _10daysago),
    runAdaptor(process.argv[2], _50daysago),
  ]);

  res.forEach((userStats) => {
    const dates = new Set(Object.values(userStats).map((x) => x.day.getTime()));

    // This should never happen.
    if (dates.size != 1) {
      console.error("Internal Error: `res` returned different dates");
      console.error(res);
      process.exit(1);
    }

    dates.forEach((day) => {
      day = new Date(day).toDateString();
      let uniqueUsers = 0;
      let totalUsers = 0;

      console.log(`------ ${day} ------\n`);
      for (const [chain, data] of Object.entries(userStats)) {
        console.log(`--- ${chain} ---`);
        console.log("Total Users".padEnd(25, " "), data.total_users);
        console.log("Unique Users".padEnd(25, " "), data.unique_users);

        uniqueUsers += data.unique_users;
        totalUsers += data.total_users;
      }

      console.log("\n------ Totals ------");
      console.log("Total Users".padEnd(25, " "), totalUsers);
      console.log("Unique Users".padEnd(25, " "), uniqueUsers, "\n");
    });
  });
})();
