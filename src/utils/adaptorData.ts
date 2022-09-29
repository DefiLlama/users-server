import type { Chain } from "@defillama/sdk/build/general";
import type { AdaptorExport } from "./adaptor";
import adaptors from "../adaptors/all"

import { SUPPORTED_CHAINS } from "./constants";

const getAdaptors = async () => {
  return Object.fromEntries(
    (adaptors).map(({name, adaptor}) => {
      const chains = Object.keys(adaptor);

      const difference = chains.filter((x) => !SUPPORTED_CHAINS.includes(x));
      const idx = difference.indexOf("category");
      if (idx > -1) difference.splice(idx, 1);

      if (difference.length > 0) {
        console.log(
          "Unsupported export chain keys found",
          `- removing chains: '${difference}' on '${name}'`
        );

        difference.forEach((chain) => delete adaptor[chain as Chain]);
      }

      return [name, adaptor];
    })
  ) as Record<Chain, AdaptorExport>;
};

export default getAdaptors;
