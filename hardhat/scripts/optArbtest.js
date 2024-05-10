import pkg from "hardhat";
import BigNumber from "bignumber.js";
const { ethers } = pkg;
import { arbitrage_calculation } from "../helpers.js";
import {
  optimalXin,
  optimalXout,
  optimalYin,
  optimalYout,
} from "./optArbCalcs.js";
const SwapTokenFactory = await ethers.getContractFactory("SwapToken");
const LpTokenFactory = await ethers.getContractFactory("LpToken");
const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");

export const onChainSwapCalc = async (amountIn, fee, inReserve, outReserve) => {
  console.log(typeof amountIn, typeof fee, typeof inReserve, typeof outReserve);
  const withFee = (amountIn * BigInt(1000 - fee)) / BigInt(1000);
  const intermediate = BigInt(outReserve * withFee);
  const intermediate2 = BigInt(inReserve + withFee);
  const final = intermediate / intermediate2;
  return final;
};

const setupPool = async () => {
  const [owner] = await ethers.getSigners();
  const swap1 = await SwapTokenFactory.deploy(0n, "SwapToken1", "SWP1");
  const swap2 = await SwapTokenFactory.deploy(0n, "SwapToken2", "SWP2");
  const lpToken = await LpTokenFactory.deploy(0n, "LpToken", "LP");
  const liquidityPool = await LiquidityPoolFactory.deploy(
    swap1,
    swap2,
    lpToken
  );
  await lpToken.transferOwnership(liquidityPool);
  const a_amount = 500n;
  const b_amount = 1000n;
  await swap1.mint(a_amount, { from: owner.address });
  await swap2.mint(b_amount, { from: owner.address });

  await swap1.approve(liquidityPool, a_amount, { from: owner.address });
  await swap2.approve(liquidityPool, b_amount, { from: owner.address });
  await liquidityPool.addLiquidity(a_amount, b_amount, 0, {
    from: owner.address,
  });
  return [swap1, swap2, lpToken, liquidityPool];
};

//internal > external
//user has Y, buy X externally and sell to pool
//so X is coming in

//RETURN OPTIMAL AMOUNT OF Y TO SWAP INTO THE POOL (returns x which we then sell to external market)
const testOptimalXin = async () => {
  const [swap1, swap2, lpToken, liquidityPool] = await setupPool();
  const a_amount = await liquidityPool.token1_reserve();
  const b_amount = await liquidityPool.token2_reserve();
  const externalRatio = 1.4;
  const oldInternalRatio = await liquidityPool.getReserveRatio();
  console.log("Old internal ratio: ", oldInternalRatio);
  const optimal_amount = await optimalXin(
    externalRatio,
    liquidityPool,
    swap1,
    swap2
  );
  console.log("Optimal amount of token1 to swap: ", optimal_amount);
  await swap1.mint(optimal_amount);
  await swap1.approve(liquidityPool, optimal_amount);
  //perform simulation swap to view profit
  const outputAmount = await onChainSwapCalc(
    optimal_amount,
    3,
    a_amount,
    b_amount
  );
  const initialBPurchase = BigInt(
    Math.floor(BigNumber(externalRatio).multipliedBy(optimal_amount))
  );
  console.log(
    `Purchasing ${optimal_amount} A for ${initialBPurchase} B from external market`
  );
  console.log("Output B amount: ", outputAmount);

  await liquidityPool.swap(swap1, optimal_amount);
  const newInternalRatio = await liquidityPool.getReserveRatio();
  console.log("New internal ratio: ", newInternalRatio);
  const profit = outputAmount - initialBPurchase;
  console.log("Total token B profit: ", profit);

  return optimal_amount;
};

// interal < external
//user has Y, buy X from the pool and sell it externally
//x coming out of the pool
//RETURN the optimal amount of Y to swap into the pool in order to swap the
const testOptimalXout = async () => {
  const [swap1, swap2, lpToken, liquidityPool] = await setupPool();
  const a_amount = await liquidityPool.token1_reserve();
  const b_amount = await liquidityPool.token2_reserve();
  const externalRatio = 2.2;
  const oldInternalRatio = await liquidityPool.getReserveRatio();

  const product = a_amount * b_amount;
  const optimalAmount = await optimalXout(
    externalRatio,
    liquidityPool,
    a_amount,
    b_amount
  ); //optimalAmount is the optimal amount of A to buy from the pool
  console.log("Optimal amount of X to remove from pool: ", optimalAmount);
  //now calculate the amount of Y to add for this
  //(x - dx) (y + dy) = k
  //we have new x value (x-dx);
  //so new y = k / x-dx
  const newX = BigNumber(a_amount) - BigNumber(optimalAmount);
  const newY = BigNumber(product) / newX;
  const optY = BigInt(Math.floor(newY - BigNumber(b_amount)));
  console.log("Optimal amount of y to add in: ", optY);
  //try it
  await swap2.mint(optY);
  await swap2.approve(liquidityPool, optY);
  await liquidityPool.swap(swap2, optY);
  const newInternalRatio = await liquidityPool.getReserveRatio();
  console.log("New Internal Ratio: ", newInternalRatio);
  //return optY as we need to buy this amount of Y to swap into the pool for optimal amount of X removal (i.e. purchase the optimal amount of X)
  return optY;
};

//internal < externnal
//user has X
//y more expensive inside the pool
//buy y externally, sell it to the pool
//Y coming into the pool
// RETURN THE OPTIMAL AMOUNT OF Y TO SWAP INTO THE POOL TO EQUAL THE RATIOS ( this amount can be purchased using external ratio)
const testOptimalYin = async () => {
  const [swap1, swap2, lpToken, liquidityPool] = await setupPool();
  const a_amount = await liquidityPool.token1_reserve();
  const b_amount = await liquidityPool.token2_reserve();
  const externalRatio = 2.2;
  console.log("Ex Ratio: ", externalRatio);
  const oldInternalRatio = await liquidityPool.getReserveRatio();
  const product = a_amount * b_amount;
  console.log("Old Internal Ratio: ", oldInternalRatio);
  const optimal = await optimalYin(externalRatio, liquidityPool, swap1, swap2);
  //buy this amount of y from external
  await swap2.mint(optimal);
  await swap2.approve(liquidityPool, optimal);
  await liquidityPool.swap(swap2, optimal);

  const newInternalRatio = await liquidityPool.getReserveRatio();
  console.log("New Internal Ratio: ", newInternalRatio);
  console.log(optimal);
  //returns the optimal amount of Y to purchase from the pool
  return optimal;
};

//internal > external
//Y is cheaper inside the pool
//buy Y from the pool (with X) and sell it externally
//Y coming out of the pool

//need to bring intenal ratio down by removing some y

const testOptimalYout = async () => {
  const externalRatio = 1.6;
  console.log("External ratio: ", externalRatio * 1e18);
  const [swap1, swap2, lpToken, liquidityPool] = await setupPool();
  const a_amount = await liquidityPool.token1_reserve();
  const b_amount = await liquidityPool.token2_reserve();
  const product = a_amount * b_amount;

  const oldInternalRatio = await liquidityPool.getReserveRatio();
  console.log("Old Internal Ratio: ", oldInternalRatio);
  const optimal = await optimalYout(externalRatio, liquidityPool, swap1, swap2);
  console.log("Optimal amount of Y to swap out: ", optimal);

  const newY = BigNumber(b_amount) - BigNumber(optimal);
  const newX = BigNumber(product) / newY;
  const optX = BigInt(Math.floor(newX - BigNumber(a_amount)));
  console.log("Amount of X to put in: ", optX);

  await swap1.mint(optX);
  await swap1.approve(liquidityPool, optX);
  await liquidityPool.swap(swap1, optX);
  const newInternalRatio = await liquidityPool.getReserveRatio();
  console.log("New Internal Ratio: ", newInternalRatio);
  return optX;
};

await testOptimalXin();
console.log("\n");
await testOptimalXout();
console.log("\n");
await testOptimalYin();
console.log("\n");
await testOptimalYout();
console.log("\n");
