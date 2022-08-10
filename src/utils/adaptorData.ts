import type { Chain } from "@defillama/sdk/build/general";
import type { AdaptorExport } from "./adaptor";

import { readdir } from "fs/promises";
import path from "path";

import { SUPPORTED_CHAINS } from "./constants";

const getDirectories = async (path: string) =>
  (await readdir(path, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const getAdaptors = async () => {
  const adaptors = await getDirectories(
    path.resolve(process.cwd(), "src", "adaptors")
  );

  const adaptorImports: AdaptorExport[] = await Promise.all(
    adaptors.map(
      async (adaptor) => (await import(`./../adaptors/${adaptor}`)).default
    )
  );

  return Object.fromEntries(
    adaptors.map((_, i) => {
      const chains = Object.keys(adaptorImports[i]);

      const difference = chains.filter((x) => !SUPPORTED_CHAINS.includes(x));
      if (difference.length > 0) {
        console.log(
          "Unsupported export chain keys found",
          `- removing chains: '${difference}' on '${_}'`
        );

        difference.forEach((chain) => delete adaptorImports[i][chain as Chain]);
      }

      return [adaptors[i], adaptorImports[i]];
    })
  ) as Record<Chain, AdaptorExport>;
};

export default getAdaptors;
