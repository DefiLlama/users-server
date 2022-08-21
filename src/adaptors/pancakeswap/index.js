import { BSC } from "../../helpers/chains";

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
  [BSC]: {
    all: () => [
      "0x73feaa1ee314f8c655e354234017be2193c9e24e", // Masterchef
      "0x10ED43C718714eb63d5aA57B78B54704E256024E", // Router v2
      "0x5aF6D33DE2ccEC94efb1bDF8f92Bd58085432d2c", // Lottery v2
      "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA", // Prediction v2
      "0x17539cCa21C7933Df5c980172d22659B8C345C5A", // NFT Market v1
    ],
    ...getUsers(BSC, "0x10ED43C718714eb63d5aA57B78B54704E256024E"),
  },
};
