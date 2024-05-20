import pkg from "hardhat";
import BigNumber from "bignumber.js";
const { ethers } = pkg;
const { parseEther } = ethers;
const SwapTokenFactory = await ethers.getContractFactory("SwapToken");
const LpTokenFactory = await ethers.getContractFactory("LpToken");
const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");

import {
  optimalXin,
  optimalXout,
  optimalYin,
  optimalYout,
} from "./scripts/optArbCalcs.js";
import { sec } from "mathjs";

const main = async () => {
  const swap1 = await SwapTokenFactory.deploy(0n, "SwapToken1", "A");
  const swap2 = await SwapTokenFactory.deploy(0n, "SwapToken2", "B");
  const lpToken = await LpTokenFactory.deploy(0n, "LpToken", "LP");
  const liquidityPool = await LiquidityPoolFactory.deploy(
    swap1,
    swap2,
    lpToken
  );
  await lpToken.transferOwnership(liquidityPool);

  const [owner, second, third] = await ethers.getSigners();
  await swap1.mint(1000);
  await swap2.mint(1800);
  await swap1.approve(liquidityPool, 1000);
  await swap2.approve(liquidityPool, 1800);
  await liquidityPool.addLiquidity(1000, 1800, 0);

  const lpShares = await lpToken.balanceOf(owner);
  console.log("lpShares: ", lpShares.toString());

  //second user adds 300 and 540 A:B
  const secondswap1 = swap1.connect(second);
  const secondswap2 = swap2.connect(second);
  const secondlpToken = lpToken.connect(second);
  const secondPool = liquidityPool.connect(second);
  await secondswap1.mint(300);
  await secondswap2.mint(540);
  await secondswap1.approve(secondPool, 300);
  await secondswap2.approve(secondPool, 540);
  await secondPool.addLiquidity(300, 540, 0);
  const secondLpShares = await secondlpToken.balanceOf(second.address);
  console.log("secondLpShares: ", secondLpShares.toString());
  //fetch reserve state
  const reserve1 = await liquidityPool.token1_reserve();
  const reserve2 = await liquidityPool.token2_reserve();
  console.log("reserve1: ", reserve1.toString());
  console.log("reserve2: ", reserve2.toString());

  const initialAVal = 9;
  const initialBVal = 5;
  const depositVal = 9 * 300 + 5 * 540;
  console.log("depositVal: ", depositVal);
  //external ratio changes from 1.8 to 1.6
  //execute a trade from third account
  const thirdswap1 = swap1.connect(third);
  const thirdswap2 = swap2.connect(third);
  const thirdPool = liquidityPool.connect(third);
  const thirdLpToken = lpToken.connect(third);
  await thirdswap2.mint(78);
  const initialArb = 78 * 1.6;
  console.log("initial ARB value: ", initialArb);
  //buy A for B on external market
  const externalA = Math.floor(78);
  await thirdswap2.burn(78);
  const newBal = await thirdswap2.balanceOf(third);
  console.log("newBBal before trade: ", newBal.toString());
  await thirdswap1.mint(externalA);
  await thirdswap1.approve(thirdPool, externalA);
  await thirdPool.swap(thirdswap1, externalA);
  //check third address token 2 balance;
  const thirdSwap2Bal = await thirdswap2.balanceOf(third);
  console.log("thirdSwap2Bal: ", thirdSwap2Bal.toString());

  //lp removes their liquidity
  const lpBal = await secondlpToken.balanceOf(second);
  await secondPool.removeLiquidity(lpBal);
  //check balances
  const secondSwap1Bal = await secondswap1.balanceOf(second);
  const secondSwap2Bal = await secondswap2.balanceOf(second);
  console.log("secondSwap1Bal: ", secondSwap1Bal.toString());
  console.log("secondSwap2Bal: ", secondSwap2Bal.toString());
};

console.log("hi");
await main();
