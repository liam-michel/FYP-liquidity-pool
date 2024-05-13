import pkg from "hardhat";
import BigNumber from "bignumber.js";
import { simulatePoissonProcess, randomWalk } from "./evaluationHelpers.js";
const { ethers } = pkg;
const { parseEther } = ethers;
import {
  optimalXin,
  optimalXout,
  optimalYin,
  optimalYout,
} from "./optArbCalcs.js";
const SwapTokenFactory = await ethers.getContractFactory("SwapToken");
const LpTokenFactory = await ethers.getContractFactory("LpToken");
const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");

const executeArbitrage = async (
  external_ratio,
  token1,
  token2,
  liquidityPool,
  userChoice,
  signer
) => {
  console.log("hi");
  const internal_ratio = await liquidityPool.getReserveRatio();
  const external_ratio_scaled = BigInt(external_ratio * 1e18);
  const token1_reserve = await liquidityPool.token1_reserve();
  const token2_reserve = await liquidityPool.token2_reserve();
  //at start of each swap, mint 10% of reserves to the user
  const mint1 = BigInt(Math.floor(BigNumber(token1_reserve).dividedBy(10)));
  const mint2 = BigInt(Math.floor(BigNumber(token2_reserve).dividedBy(10)));
  await token1.mint(mint1);
  await token2.mint(mint2);

  const product = token1_reserve * token2_reserve;

  const oldABalance = await token1.balanceOf(signer);
  const oldBBalance = await token2.balanceOf(signer);
  console.log("Old token A balance: ", oldABalance);
  console.log("Old token B balance: ", oldBBalance);
  const down_internal_ratio = BigNumber(internal_ratio).dividedBy(1e18);
  console.log("Internal ratio: ", down_internal_ratio);
  console.log("External ratio: ", external_ratio);
  const userToken = await userChoice.symbol();
  const userBalance = await userChoice.balanceOf(signer);

  //user has B
  //A more expensive inside. Buy A external, sell to pool
  if (internal_ratio > external_ratio_scaled && userToken == "B") {
    //user has B so we buy A externally and sell to the pool
    console.log('internal_ratio > external_ratio && userToken == "B"');
    const optimalAmountA = await optimalXin(
      external_ratio,
      liquidityPool,
      token1,
      token2
    );
    console.log("Optimal amount of A to swap into the pool: ", optimalAmountA);
    //purchase this amount of the token from the external market
    const optimalB = BigInt(
      Math.floor(BigNumber(optimalAmountA).multipliedBy(external_ratio))
    );
    //check if the user balance is < the optimal amount
    let chosenAmount;
    if (userBalance < optimalB) {
      console.log("User balance is less than the optimal amount");
      chosenAmount = getRandomInt(userBalance / BigInt(2), userBalance);
      //pick a value that is between userBalance /2 , userBalance
    } else {
      chosenAmount = getRandomInt(userBalance / BigInt(2), optimalB);
    }
    console.log("chosenAmount: ", chosenAmount);
    //purchase the amount of the token from the external market
    const amountAExternal = BigInt(
      Math.floor(BigNumber(chosenAmount).dividedBy(external_ratio))
    );
    await token1.mint(amountAExternal);
    await token2.burn(chosenAmount);
    //do the swap
    await token1.approve(liquidityPool, amountAExternal);
    await liquidityPool.swap(token1, amountAExternal);
    const newBBalance = await token2.balanceOf(signer);
    const profit = newBBalance - oldBBalance;
    console.log("Total token B profit: ", profit);
    return true;
  }

  //A cheaper inside the pool, buy from the pool and sell external
  else if (internal_ratio < external_ratio_scaled && userToken == "B") {
    console.log('internal_ratio < external_ratio_scaled && userToken == "B"');
    const optimalB = await optimalXout(
      external_ratio,
      liquidityPool,
      token1,
      token2
    );
    const newX = BigNumber(token1_reserve) - BigNumber(optimalB);
    const newY = BigNumber(product) / newX;
    const optY = BigInt(Math.floor(newY - BigNumber(token2_reserve)));
    console.log("Optimal amount of y to add in: ", optY);

    let chosenAmount;

    if (userBalance < optY) {
      console.log("User balance is less than the optimal amount");
      chosenAmount = getRandomInt(userBalance / BigInt(2), userBalance);
    } else {
      chosenAmount = getRandomInt(userBalance / BigInt(2), optY);
    }
    console.log("chosenAmount: ", chosenAmount);

    //now with chosen amount of Y, buy A from the pool
    await token2.approve(liquidityPool, chosenAmount);
    await liquidityPool.swap(token2, chosenAmount);
    const new_abal = await token1.balanceOf(signer);
    const difference = new_abal - oldABalance;
    //sell the difference to the external market (do this by converting with ratio, minting the converted amount and burning the original amount)
    const amountBExternal = BigInt(
      Math.floor(BigNumber(difference).multipliedBy(external_ratio))
    );
    await token2.mint(amountBExternal);
    await token1.burn(difference);
    //sell the token A for token B (to external market) (do a conversion);
    const newBBalance = await token2.balanceOf(signer);
    const profit = newBBalance - oldBBalance;
    console.log("Total token B profit: ", profit);
    return true;
  }

  //Buy Token B external, sell to the pool
  else if (internal_ratio < external_ratio_scaled && userToken == "A") {
    console.log('internal_ratio < external_ratio_scaled && userToken == "A"');
    const optimalB = await optimalYin(
      external_ratio,
      liquidityPool,
      token1,
      token2
    );
    let chosenAmount;

    if (userBalance < optimalB) {
      chosenAmount = getRandomInt(userBalance / BigInt(2), userBalance);
    } else {
      chosenAmount = getRandomInt(userBalance / BigInt(2), optimalB);
    }
    console.log("chosenAmount: ", chosenAmount);

    const amountBExternal = BigInt(
      Math.floor(BigNumber(chosenAmount).multipliedBy(external_ratio))
    );
    await token2.mint(amountBExternal);
    await token1.burn(chosenAmount);
    await token2.approve(liquidityPool, amountBExternal);
    await liquidityPool.swap(token2, amountBExternal);
    const newABalance = await token1.balanceOf(signer);
    const profit = newABalance - oldABalance;
    console.log("Total token A profit: ", profit);
    return true;
  }

  //Higher A, lower B internal. Buy B from the pool and sell external
  else if (internal_ratio > external_ratio_scaled && userToken == "A") {
    console.log('internal_ratio > external_ratio_scaled && userToken == "A"');
    const optimalB = await optimalYout(
      external_ratio,
      liquidityPool,
      token1,
      token2
    );
    console.log("Optimal amount of Y to swap out: ", optimalB);
    const newB = BigNumber(token2_reserve) - BigNumber(optimalB);
    const newA = BigNumber(product) / newB;
    const optA = BigInt(Math.floor(newA - BigNumber(token1_reserve)));
    console.log("Amount of X to put in: ", optA);
    let chosenAmount;

    if (userBalance < optA) {
      chosenAmount = getRandomInt(userBalance / BigInt(2), userBalance);
    } else {
      chosenAmount = getRandomInt(userBalance / BigInt(2), optA);
    }
    console.log("chosenAmount: ", chosenAmount);

    await token1.approve(liquidityPool, chosenAmount);
    await liquidityPool.swap(token1, chosenAmount);
    const new_bbal = await token2.balanceOf(signer);
    const difference = new_bbal - oldBBalance;
    //sell the difference to the external market (do this by converting with ratio, minting the converted amount and burning the original amount)
    const amountAExternal = BigInt(
      Math.floor(BigNumber(difference).dividedBy(external_ratio))
    );
    await token1.mint(amountAExternal);
    await token2.burn(difference);

    //sell the token B
    const newABalance = await token1.balanceOf(signer);
    console.log("New A balance: ", newABalance);
    const profit = newABalance - oldABalance;
    console.log("Total token A profit: ", profit);
    return true;
  }
  return false;
};

const setupLiquidityPool = async () => {
  const swap1 = await SwapTokenFactory.deploy(0n, "SwapToken1", "A");
  const swap2 = await SwapTokenFactory.deploy(0n, "SwapToken2", "B");
  const lpToken = await LpTokenFactory.deploy(0n, "LpToken", "LP");
  const liquidityPool = await LiquidityPoolFactory.deploy(
    swap1,
    swap2,
    lpToken
  );
  await lpToken.transferOwnership(liquidityPool);
  return [swap1, swap2, lpToken, liquidityPool];
};

const main = async () => {
  const [swap1, swap2, lpToken, liquidityPool] = await setupLiquidityPool();
  const signer = await ethers.getSigners()[0];
  const balance = swap1.balanceOf(signer);

  console.log(balance);
  // const initialA = parseEther("500000");
  // const initialB = parseEther("1000000");
  // await swap1.mint(initialA);
  // await swap2.mint(initialB);

  // await swap1.approve(liquidityPool, initialA);
  // await swap2.approve(liquidityPool, initialB);
  // await liquidityPool.addLiquidity(initialA, initialB, 0);

  // const externalRatio = 1.5;
  // const choice = swap2;
  // const userChoice = await choice.symbol();
  // const signer = await ethers.getSigners()[0];
  // const userswap1 = swap1.connect(signer);
  // const userswap2 = swap2.connect(signer);
  // const userlpToken = lpToken.connect(signer);
  // const userLiquidityPool = liquidityPool.connect(signer);

  // const result = await executeArbitrage(
  //   externalRatio,
  //   userswap1,
  //   userswap2,
  //   userLiquidityPool,
  //   userChoice,
  //   signer
  // );
};

await main();
