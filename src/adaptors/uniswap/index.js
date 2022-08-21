import { ETHEREUM } from "../../helpers/chains";

export default {
  [ETHEREUM]: {
    all: () => [
      "0xE592427A0AEce92De3Edee1F18E0157C05861564", // V3 Router
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // V3 Router 2
      "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", // V3 Positions NFT
      "0xf164fc0ec4e93095b804a4795bbe1e041497b92a", // V2 Router
      "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // V2 Router 2
    ],
  },
};
