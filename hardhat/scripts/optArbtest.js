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
    Math.floor(BigNumber(1.4).multipliedBy(optimal_amount))
  );
  console.log(`Purchasing ${optimal_amount} A for ${initialBPurchase} B`);
  console.log("Output B amount: ", outputAmount);

  await liquidityPool.swap(swap1, optimal_amount);
  const newInternalRatio = await liquidityPool.getReserveRatio();
  console.log("New internal ratio: ", newInternalRatio);
  const profit = outputAmount - initialBPurchase;
  console.log("Total token B profit: ", profit);
};

const testOptimalXout = async () => {};

await testOptimalXin();

//buy A for B from external
//sell A to pool until ratio matches
//compare B output to B input for profit
