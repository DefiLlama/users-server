// https://defillama.com/categories

const DEXES = "Dexes";
const LENDING = "Lending";
const BRIDGE = "Bridge";
const CDP = "CDP";
const LIQUID_STAKING = "Liquid Staking";
const YIELD = "Yield";
const SERVICES = "Services";
const DERIVATIVES = "Derivates";
const YIELD_AGGREGATOR = "Yield Aggregator";
const ALGO_STABLES = "Algo-Stables";
const CROSS_CHAIN = "Cross Chain";
const INSURANCE = "Insurance";
const LAUNCHPAD = "Launchpad";
const PAYMENTS = "Payments";
const RESERVE_CURRENCY = "Reserve Currency";
const PRIVACY = "Privacy";
const OPTIONS = "Options";
const INDEXES = "Indexes";
const SYNTHETICS = "Synthetics";
const RWA = "RWA";
const STAKING = "Staking";
const NFT_LENDING = "NFT Lending";
const FARM = "Farm";
const NFT_MARKETPLACE = "NFT Marketplace";
const GAMING = "Gaming";
const PREDICTION_MARKET = "Prediction Market";
const ORACLE = "Oracle";

// What each category *may* export for detailed user metrics.
const CATEGORY_USER_EXPORTS = {
  [DEXES]: ["deposits", "withdrawals", "traders"],
  [LENDING]: ["borrows", "lendings"],
};

export {
  DEXES,
  LENDING,
  BRIDGE,
  CDP,
  LIQUID_STAKING,
  YIELD,
  SERVICES,
  DERIVATIVES,
  YIELD_AGGREGATOR,
  ALGO_STABLES,
  CROSS_CHAIN,
  INSURANCE,
  LAUNCHPAD,
  PAYMENTS,
  RESERVE_CURRENCY,
  PRIVACY,
  OPTIONS,
  INDEXES,
  SYNTHETICS,
  RWA,
  STAKING,
  NFT_LENDING,
  FARM,
  NFT_MARKETPLACE,
  GAMING,
  PREDICTION_MARKET,
  ORACLE,
  CATEGORY_USER_EXPORTS,
};
