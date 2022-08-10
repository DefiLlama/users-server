function chainExports(chainTvl, chains) {
  const chainTvls = chains.reduce(
    (obj, chain) => ({
      ...obj,
      [chain]: () => chainTvl(chain),
    }),
    {}
  );

  return chainTvls;
}

export { chainExports };
