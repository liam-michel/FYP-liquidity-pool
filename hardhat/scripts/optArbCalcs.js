import BigNumber from "bignumber.js";

//optimal x in for selling to the pool
//optimal x out == optimal y in 
//for usage when user has token B, internal ratio is higher than external
//so opportunity to buy token A externally (for B) and sell it to the pool
//until internal ratio falls to match external ratio;
export const optimalXin = async (
  externalRatio,
  liquidityPool,
  token1,
  token2
) => {
  externalRatio = BigNumber(externalRatio);
  const reserve1 = BigNumber(await liquidityPool.token1_reserve());
  const reserve2 = BigNumber(await liquidityPool.token2_reserve());
  const constantProduct = reserve1.multipliedBy(reserve2);
  const optimal = BigInt(
    Math.floor(Math.sqrt(constantProduct / externalRatio) - reserve1)
  );
  return optimal;
};

//for usage when user has token B, internal ratio is lower than external
//so opportunity to buy token A from the pool until the price ratio rises to match external ratio
export const optimalXout = async (
  externalRatio,
  liquidityPool,
  token1,
  token2
) => {
  externalRatio = BigNumber(externalRatio);
  const reserve1 = BigNumber(await liquidityPool.token1_reserve());
  const reserve2 = BigNumber(await liquidityPool.token2_reserve());
  const constantProduct = reserve1.multipliedBy(reserve2);
  const optimal = BigInt(Math.abs(Math.floor(reserve1 - Math.sqrt(constantProduct / externalRatio))));
  return optimal;
};

export const optimalYin = async (
  externalRatio,
  liquidityPool,
  token1,
  token2
) => {
  externalRatio = BigNumber(externalRatio);
  const reserve1 = BigNumber(await liquidityPool.token1_reserve());
  const reserve2 = BigNumber(await liquidityPool.token2_reserve());
  const constantProduct = reserve1.multipliedBy(reserve2);
  const optimal = BigInt(
    Math.floor(reserve2 - Math.floor(constantProduct * externalRatio))
  );
  return optimal;
};

export const optimalYout = async (
  externalRatio,
  liquidityPool,
  token1,
  token2
) => {
  externalRatio = BigNumber(externalRatio);
  const reserve1 = BigNumber(await liquidityPool.token1_reserve());
  const reserve2 = BigNumber(await liquidityPool.token2_reserve());
  const constantProduct = reserve1.multipliedBy(reserve2);
  const optimal = BigInt(
    Math.floor(Math.sqrt(constantProduct * externalRatio) - reserve2)
  );
  return optimal;
};

