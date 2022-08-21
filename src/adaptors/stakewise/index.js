import { LIQUID_STAKING } from "../../helpers/categories";
import { ETHEREUM } from "../../helpers/chains";

const getUsers = (chain, address) => {
  return {
    deposits: {
      functionNames: ["addDeposit"],
      address,
    },
    withdrawals: {
      functionNames: ["cancelDeposit"],
      address,
    },
  };
};

export default {
  [ETHEREUM]: {
    all: () => ["0xEadCBA8BF9ACA93F627F31fB05470F5A0686CEca"],
    ...getUsers(ETHEREUM, "0xEadCBA8BF9ACA93F627F31fB05470F5A0686CEca"),
  },
  category: LIQUID_STAKING,
};
