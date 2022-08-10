import * as sdk from "@defillama/sdk";

import abi from "./abi.json";
import {
  ETHEREUM,
  AVAX,
  FANTOM,
  POLYGON,
  ARBITRUM,
  BSC,
  OPTIMISM,
  XDAI,
} from "../../helpers/chains";
import { chainExports } from "../../helpers/exports";

const FACTORY_ADDRESSES = {
  [ETHEREUM]: "0xde1C04855c2828431ba637675B6929A684f84C7F",
  [AVAX]: "0x7d507b4c2d7e54da5731f643506996da8525f4a3",
  [FANTOM]: "0xde1C04855c2828431ba637675B6929A684f84C7F",
  [POLYGON]: "0xde1C04855c2828431ba637675B6929A684f84C7F",
  [ARBITRUM]: "0xde1C04855c2828431ba637675B6929A684f84C7F",
  [BSC]: "0xde1C04855c2828431ba637675B6929A684f84C7F",
  [OPTIMISM]: "0xde1C04855c2828431ba637675B6929A684f84C7F",
  [XDAI]: "0xde1C04855c2828431ba637675B6929A684f84C7F",
};

function createIncrementArray(length) {
  const arr = [];
  for (let i = 0; i < length; i++) arr.push(i);
  return arr;
}

const getAddresses = async (chain) => {
  const factory = FACTORY_ADDRESSES[chain];
  if (factory === undefined) throw `${chain} factory N/A`;

  const contractCount = Number(
    (
      await sdk.api.abi.call({
        abi: abi.getLlamaPayContractCount,
        target: factory,
        chain: chain,
      })
    ).output
  );

  const { output: contractInfos } = await sdk.api.abi.multiCall({
    calls: createIncrementArray(contractCount).map((i) => ({ params: i })),
    abi: abi.getLlamaPayContractByIndex,
    target: factory,
    requery: true,
    chain: chain,
  });

  return contractInfos.map((x) => x.output);
};

export default chainExports(getAddresses, Object.keys(FACTORY_ADDRESSES));
