#!/usr/bin/env node
import { runAdaptor } from "./src/utils/adaptor";

(async () => {
  if (process.argv.length < 3) {
    console.error(`Missing argument, you need to provide the filename of the adapter to test.
      Eg: npm run test YOUR_ADAPTOR`);
    process.exit(1);
  }

  const yesterday = new Date(Date.now() - 864e5);
  /*const _3daysago = new Date(Date.now() - 864e5 * 3);
  const _10daysago = new Date(Date.now() - 864e5 * 10);
  const _50daysago = new Date(Date.now() - 864e5 * 50);*/
  const days = [yesterday /*, _3daysago, _10daysago, _50daysago */];

  const args = {
    ignoreChainRugs: true,
  };

  const res = await Promise.all([
    runAdaptor(process.argv[2], yesterday, args),
    /* runAdaptor(process.argv[2], _3daysago, args),
    runAdaptor(process.argv[2], _10daysago, args),
    runAdaptor(process.argv[2], _50daysago, args), */
  ]);

  res.forEach((userStats, i) => {
    const day = days[i].toDateString();
    let uniqueUsers = 0;
    let totalUsers = 0;

    console.log(`------ ${day} ------\n`);
    for (const [chain, stats] of Object.entries(userStats)) {
      console.log(`--- ${chain} ---`);
      for (const [column, data] of Object.entries(stats)) {
        console.log(`- ${column} -`);
        console.log(" Total Users".padEnd(25, " "), data.total_users);
        console.log(" Unique Users".padEnd(25, " "), data.unique_users);

        uniqueUsers += data.unique_users;
        totalUsers += data.total_users;
      }
    }

    console.log("\n------ Totals ------");
    console.log("Total Users".padEnd(25, " "), totalUsers);
    console.log("Unique Users".padEnd(25, " "), uniqueUsers, "\n");
  });

  process.exit(0);
})();
