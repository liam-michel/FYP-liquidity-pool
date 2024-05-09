import BigNumber from "bignumber.js";

//internal > external
//user has Y, buy X externally and sell to pool
//so X is coming in
//RETURN OPTIMAL AMOUNT OF token X to swap into the pool
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

// interal < external
//user has B, buy X from the pool and sell it externally
//x coming out of the pool
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
  const optimal = BigInt(
    Math.abs(Math.floor(reserve1 - Math.sqrt(constantProduct / externalRatio)))
  );
  return optimal;
};

//internal < externnal
//user has X
//y more expensive inside the pool
//buy y externally, sell it to the pool
//Y coming into the pool

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
  const intermed1 = BigNumber(Math.sqrt(constantProduct * externalRatio));

  const optimal = BigInt(Math.floor(intermed1 - reserve2));
  return optimal;
};

//internal > external
//Y is cheaper inside the pool
//buy Y from the pool (with X) and sell it externally
//Y coming out of the pool
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
    Math.floor(reserve2 - Math.sqrt(constantProduct * externalRatio))
  );
  return optimal;
};

//all functions in this file should return the OPTIMAL amount of {tokenIn} they should be swapping into the pool for the given arbitrage trade
