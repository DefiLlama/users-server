function chainExports(chainTvl, chains) {
  const chainTvls = chains.reduce(
    (obj, chain) => ({
      ...obj,
      [chain]: {
        all: () => chainTvl(chain),
      },
    }),
    {}
  );

  return chainTvls;
}

export { chainExports };
