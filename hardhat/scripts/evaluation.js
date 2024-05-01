import pkg from "hardhat";
import {
  simulatePoissonProcess,
  simulateBrownianMotion,
} from "./evaluationHelpers.js";
import { arbitrage_calculation } from "../helpers.js";
import { Result } from "ethers";
import { random } from "mathjs";
const { ethers } = pkg;
const { parseEther } = ethers;
const SwapTokenFactory = await ethers.getContractFactory("SwapToken");
const LpTokenFactory = await ethers.getContractFactory("LpToken");
const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");
const DynamicLiquidityPoolFactory = await ethers.getContractFactory(
  "DynamicLiquidityPool"
);

function getRandomInt(min, max) {
  min = BigInt(Math.ceil(Number(min)));
  max = BigInt(Math.floor(Number(max)));
  return (
    BigInt(Math.floor(Math.random() * (Number(max) - Number(min) + 1))) + min
  );
}

const smartSwap = async (external_ratio, token1, token2, pool, signer) => {
  const token_choice = Math.random() > 0.5 ? token1 : token2;
  const token_symbol = await token_choice.symbol();
  const userBalance = await token_choice.balanceOf(signer.address);
  const amount = getRandomInt(userBalance / BigInt(2), userBalance);

  //now evaluate if there is arbitrage opportunity
  //fetch internal reserves to evaluate internal ratio
  const token1_reserve = await pool.token1_reserve();
  const token2_reserve = await pool.token2_reserve();
  const internal_ratio = await pool.getReserveRatio();
  console.log("Internal ratio: ", internal_ratio.toString());
};

const randomSwap = async (token1, token2, pool, signer) => {
  const token_choice = Math.random() > 0.5 ? token1 : token2;
  const token_symbol = await token_choice.symbol();
  const userBalance = await token_choice.balanceOf(signer.address);
  const amount = getRandomInt(userBalance / BigInt(2), userBalance);

  //console.log(`Swapping ${amount} of ${token_symbol}`)
  //connect with current_signer
  const current_pool = pool.connect(signer);
  const current_token_choice = token_choice.connect(signer);

  await current_token_choice.approve(current_pool, amount);
  await current_pool.swap(current_token_choice, amount);
};

const generateAmounts = (count, lower, upper) => {
  const amounts = [];
  for (let i = 0; i < count; i++) {
    const amount = Math.floor(Math.random() * (upper - lower) + lower);
    amounts.push(amount);
  }
  return amounts;
};

const mintTokensAll = async (token1, token2, signers) => {
  for (let i = 0; i < signers.length; i++) {
    const current_signer = signers[i];
    //connect current signer to contract
    const current_token1 = token1.connect(current_signer);
    const current_token2 = token2.connect(current_signer);
    //mint 100 of token1 and token2 to them
    await current_token1.mint(parseEther("10000"));
    await current_token2.mint(parseEther("10000"));
  }
};

const setupLiquidityPool = async () => {
  const swap1 = await SwapTokenFactory.deploy(0n, "SwapToken1", "SWP1");
  const swap2 = await SwapTokenFactory.deploy(0n, "SwapToken2", "SWP2");
  const lpToken = await LpTokenFactory.deploy(0n, "LpToken", "LP");
  const liquidityPool = await LiquidityPoolFactory.deploy(
    swap1,
    swap2,
    lpToken
  );
  await lpToken.transferOwnership(liquidityPool);
  return [swap1, swap2, lpToken, liquidityPool];
};

const setupDynamicLiquidityPool = async () => {
  const swap1 = await SwapTokenFactory.deploy(0n, "SwapToken1", "SWP1");
  const swap2 = await SwapTokenFactory.deploy(0n, "SwapToken2", "SWP2");
  const lpToken = await LpTokenFactory.deploy(0n, "LpToken", "LP");
  const liquidityPool = await DynamicLiquidityPoolFactory.deploy(
    swap1,
    swap2,
    lpToken
  );
  await lpToken.transferOwnership(liquidityPool);
  return [swap1, swap2, lpToken, liquidityPool];
};

const seedLiquidities = async (swap1, swap2, liquidityPool) => {
  const initialA = parseEther("50000");
  const initialB = parseEther("100000");
  await swap1.mint(initialA);
  await swap2.mint(initialB);

  await swap1.approve(liquidityPool, initialA);
  await swap2.approve(liquidityPool, initialB);
  await liquidityPool.addLiquidity(initialA, initialB, 0);
};
const calculateProduct = (reserve1, reserve2) => {
  const product = reserve1 * reserve2;
  console.log("Product is :", product);
  return product;
};

const addLiquidity = async (
  swap1,
  swap2,
  liquidityPool,
  accounts,
  deposits,
  value1,
  value2
) => {
  const amounts = generateAmounts(accounts.length, 1, 100);
  console.log(amounts);
  for (let i = 0; i < accounts.length; i++) {
    const currentAmount = amounts[i];
    const amountA = currentAmount;
    const amountB = currentAmount * (value1 / value2);
    const account = accounts[i];
    const current_swap1 = swap1.connect(account);
    const current_swap2 = swap2.connect(account);
    const current_liquidityPool = liquidityPool.connect(account);
    await current_swap1.mint(amountA);
    await current_swap2.mint(amountB);

    await current_swap1.approve(liquidityPool, amountA);
    await current_swap2.approve(liquidityPool, amountB);
    await current_liquidityPool.addLiquidity(amountA, amountB, 0);
    //calculate values of liquidity at deposit time

    deposits[account.address] = [
      [amountA, value1],
      [amountB, value2],
    ];
  }
  return deposits;
};

const removeLiquidity = async (liquidityPool, lptoken, accounts) => {
  for (const account of accounts) {
    const current_liquidityPool = liquidityPool.connect(account);
    const current_lptoken = lptoken.connect(account);
    const shares = await current_lptoken.balanceOf(account);
    await current_liquidityPool.removeLiquidity(shares);
  }
};

const main = async () => {
  const mu = 0.0001; // Example drift
  const sigma = 0.01; // Example volatility
  const dt = 1; // Time increment (e.g., days)
  const steps = 100; // Number of steps in the simulation

  const lambda = 5;
  const duration = 100;
  //setup regular Liquidity Pool
  const [regularswap1, regularswap2, regularlpToken, regularPool] =
    await setupLiquidityPool();
  const [dynamicswap1, dynamicswap2, dynamiclpToken, dynamicPool] =
    await setupDynamicLiquidityPool();

  await seedLiquidities(regularswap1, regularswap2, regularPool);
  await seedLiquidities(dynamicswap1, dynamicswap2, dynamicPool);

  const value1 = 20;
  const transactionVolume = simulatePoissonProcess(lambda, duration);
  const assetRatios = simulateBrownianMotion(10, 0, 1, 1, 200);
  const value2 = assetRatios[0];

  console.log(assetRatios.length);
  console.log(transactionVolume.length);

  let regularDeposits = {}; //dictionary that will store array  [[amountA, priceA], [amountB, priceB]] for each user
  const accounts = await ethers.getSigners();

  const extraproviders = accounts.slice(1, 3);
  //provide some amount of liquidity with these accounts

  regularDeposits = await addLiquidity(
    regularswap1,
    regularswap2,
    regularPool,
    extraproviders,
    regularDeposits,
    value1,
    value2
  );

  console.log(regularDeposits);

  // //deposits setup

  const signers1 = accounts.slice(4, 10);
  const signers2 = accounts.slice(11, 17);
  //mint an amount of all tokens to each user
  await mintTokensAll(regularswap1, regularswap2, signers1);
  await mintTokensAll(dynamicswap1, dynamicswap2, signers2);
  const old_reserve1 = await regularPool.token1_reserve();
  const old_reserve2 = await regularPool.token2_reserve();
  console.log("Old reserve1 :", old_reserve1);
  console.log("Old reserve2: ", old_reserve2);
  calculateProduct(old_reserve1, old_reserve2);

  // // //run transactions on both pools while iterating over value ratios;

  // for (let i = 0; i < assetRatios.length; i++) {
  //   const currentRatio = assetRatios[i];
  //   const currentVolume = transactionVolume[i];
  //   const currentvalue2 = assetRatios[i];
  //   for (let j = 0; j < currentVolume; j++) {
  //     // console.log(j);
  //     //pick a random value from signers
  //     const randomIndex = Math.floor(Math.random() * signers1.length);
  //     const account = signers1[randomIndex];
  //     const current_swap1 = regularswap1.connect(account);
  //     const current_swap2 = regularswap2.connect(account);
  //     const current_liquidityPool = regularPool.connect(account);
  //     await randomSwap(
  //       current_swap1,
  //       current_swap2,
  //       current_liquidityPool,
  //       account
  //     );
  //   }
  // }
  //grab reserves
  const account = signers1[0];
  const current_swap1 = regularswap1.connect(account);
  const current_swap2 = regularswap2.connect(account);
  const current_liquidityPool = regularPool.connect(account);
  await current_swap1.mint(parseEther("100000000"));
  for (let i = 0; i < 2; i++) {
    await randomSwap(
      current_swap1,
      current_swap2,
      current_liquidityPool,
      account
    );
  }
  const reserve1 = await regularPool.token1_reserve();
  const reserve2 = await regularPool.token2_reserve();
  calculateProduct(reserve1, reserve2);
  console.log("Reserve1: ", reserve1.toString());
  console.log("Reserve2: ", reserve2.toString());
  const newValues = reserve1 * BigInt(2);
  const newValuefixed = newValues + reserve2;
  console.log("new reserve value is : ", newValuefixed.toString());

  //remove liquidity account
  const user = extraproviders[0];
  //fetch current balance of both tokens
  const oldBalanceA = await regularswap1.balanceOf(user);
  const ondBalanceB = await regularswap2.balanceOf(user);
  console.log("Old balance of A: ", oldBalanceA.toString());
  console.log("Old balance of B: ", ondBalanceB.toString());
  //fetch amount of shares, remove liquidity and then fetch new balances
  const shares = await regularlpToken.balanceOf(user);
  console.log("Shares: ", shares.toString());
  const user_pool = regularPool.connect(user);
  await user_pool.removeLiquidity(shares);
  const newBalanceA = await regularswap1.balanceOf(user);
  const newBalanceB = await regularswap2.balanceOf(user);
  console.log("New balance of A: ", newBalanceA.toString());
  console.log("New balance of B: ", newBalanceB.toString());
};

await main();
