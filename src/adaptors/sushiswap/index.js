import { ETHEREUM, POLYGON } from "../../helpers/chains";
import { DEXES } from "../../helpers/categories";

const getUsers = (chain, address) => {
  return {
    deposits: {
      functionNames: ["addLiquidity", "addLiquidityETH"],
      address,
    },
    withdrawals: {
      functionNames: [
        "removeLiquidity",
        "removeLiquidityETH",
        "removeLiquidityETHWithPermit",
      ],
      address,
    },
    traders: {
      functionNames: [
        "swapETHForExactTokens",
        "swapExactTokensForETH",
        "swapTokensForExactETH",
        "swapExactETHForTokens",
        "swapTokensForExactTokens",
        "swapExactTokensForTokens",
        "swapExactTokensForTokensSupportingFeeOnTransferTokens",
        "swapExactETHForTokensSupportingFeeOnTransferTokens",
        "swapExactTokensForETHSupportingFeeOnTransferTokens",
      ],
      address,
    },
  };
};

export default {
  [ETHEREUM]: {
    all: () => [
      "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd", // Masterchef
      "0xef0881ec094552b2e128cf945ef17a6752b4ec5d", // Masterchef v2
      "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // Router
      "0xF5BCE5077908a1b7370B9ae04AdC565EBd643966", // BentoBox v1
    ],
    ...getUsers(ETHEREUM, "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"),
  },
  [POLYGON]: {
    all: () => [
      "0xc5017be80b4446988e8686168396289a9a62668e", // Trident Router
      "0x0769fd68dfb93167989c6f7254cd0d766fb2841f", // Minichef v2
      "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // Router
      "0x0319000133d3ada02600f0875d2cf03d442c3367", // BentoBoxV1
    ],
    ...getUsers(POLYGON, "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"),
  },
  category: DEXES,
};
