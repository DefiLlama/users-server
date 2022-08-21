import { LIQUID_STAKING } from "../../helpers/categories";
import { ETHEREUM } from "../../helpers/chains";

const getUsers = (chain, address) => {
  return {
    deposits: {
      functionNames: ["deposit"],
      address,
    },
    withdrawals: {
      functionNames: [],
      address,
    },
  };
};

export default {
  [ETHEREUM]: {
    all: () => ["0x00000000219ab540356cbb839cbe05303d7705fa"],
    ...getUsers(ETHEREUM, "0x00000000219ab540356cbb839cbe05303d7705fa"),
  },
  category: LIQUID_STAKING,
};
