function chainExports(chainTvl, chains) {
  const chainTvls = chains.reduce(
    (obj, chain) => ({
      ...obj,
      [chain === "avax" ? "avalanche" : chain]: () => chainTvl(chain),
    }),
    {}
  );

  return chainTvls;
}

export { chainExports };
