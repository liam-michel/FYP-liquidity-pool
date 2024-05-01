import pkg from "hardhat";
const { ethers } = pkg;
import { arbitrage_calculation } from "../helpers.js";
const SwapTokenFactory = await ethers.getContractFactory("SwapToken");
const LpTokenFactory = await ethers.getContractFactory("LpToken");
const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");

const setupPool = async (externalRatio, tokenIn) => {
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

  const a_amount = 10000000n;
  const b_amount = 15000000n;
  await swap1.mint(a_amount, { from: owner.address });
  await swap2.mint(b_amount, { from: owner.address });

  await swap1.approve(liquidityPool, a_amount, { from: owner.address });
  await swap2.approve(liquidityPool, b_amount, { from: owner.address });
  await liquidityPool.addLiquidity(a_amount, b_amount, 0, {
    from: owner.address,
  });

  const profit = await arbitrage_calculation(
    externalRatio,
    liquidityPool,
    tokenIn,
    7000n
  ); // Use BigInt for amountIn
  if (profit > 0n) {
    console.log("profitable trade!");
  } else {
    console.log("not worth doing a trade here");
  }
  console.log("\n");
};

const main = async () => {
  await setupPool(1.5, "A");
  await setupPool(1.5, "B");
  await setupPool(1.2, "A");
  await setupPool(1.2, "B");
  await setupPool(1.7, "A");
  await setupPool(1.7, "B");
  await setupPool(1.52, "A");
  await setupPool(1.52, "B");
};

await main();
