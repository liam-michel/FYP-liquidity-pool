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

const figureOutArbitrage = async (
  external_ratio,
  token1,
  token2,
  liquidityPool,
  userToken,
  signer,
  userBalance
) => {
  const internal_ratio = await liquidityPool.getReserveRatio();
  const external_ratio_scaled = BigInt(external_ratio * 1e18);
  const token1_reserve = await liquidityPool.token1_reserve();
  const token2_reserve = await liquidityPool.token2_reserve();
  const product = token1_reserve * token2_reserve;
  console.log("External ratio: ", external_ratio_scaled);
  console.log("Internal ratio: ", internal_ratio);

  const oldABalance = await token1.balanceOf(signer);
  const oldBBalance = await token2.balanceOf(signer);
  console.log("Old A balance: ", oldABalance);
  console.log("Old B balance: ", oldBBalance);

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
  }
};

const smartSwap = async (external_ratio, regular1, regular2, regularPool, dynamic1, dynamic2, dynamicPool, signer1, signer2) => {
  const regular_choice = Math.random() > 0.5 ? regular1: regular2;
  const regular_symbol = await regular_choice.symbol();
  //now evaluate if there is arbitrage opportunity
  //fetch internal reserves to evaluate internal ratio

  const doArbitrage = 0.7 > 0.5 ? true : false;
  if (doArbitrage) {
    const success = await figureOutArbitrage(
      external_ratio,
      regular1,
      regular2,
      regularPool,
      regular_symbol,
      signer1
    );
    // if(!success){
    //   //do a random swap if no arbitrage opportunity found / exploited
    //   await randomSwap()
    // }
  } else {
    //perform random swap
    console.log("Executing a random swap");
    await randomSwap(token1, token2, pool, signer);
  }
};

//function for executing a random swap against the pool.
//This function is meant to model a random trader coming and using the pool for a regular swap from A->B or B->A
const randomSwap = async (token1, token2, pool, signer) => {
  const token_choice = Math.random() > 0.5 ? token1 : token2;
  const token_symbol = await token_choice.symbol();
  //console.log the token choice symbol
  //console.log(`Swapping ${token_symbol} into the pool`);
  const userBalance = await token_choice.balanceOf(signer.address);
  const amount = getRandomInt(userBalance / BigInt(10), userBalance);

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
    const amount =
      BigInt(Math.floor(Math.random() * (Number(upper) - Number(lower) + 1))) +
      BigInt(lower);
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
    await current_token1.mint(2000);
    await current_token2.mint(2000);
  }
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

const setupDynamicLiquidityPool = async () => {
  const swap1 = await SwapTokenFactory.deploy(0n, "SwapToken1", "A");
  const swap2 = await SwapTokenFactory.deploy(0n, "SwapToken2", "B");
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
  const lowerBound = ethers.parseEther("10");
  const upperBound = ethers.parseEther("100");
  const amounts = generateAmounts(accounts.length, lowerBound, upperBound);
  const reserve1 = await liquidityPool.token1_reserve();
  const reserve2 = await liquidityPool.token2_reserve();
  const ratio = reserve2 / reserve1;
  console.log("Ratio: ", ratio.toString());
  for (let i = 0; i < accounts.length; i++) {
    const currentAmount = amounts[i];
    console.log("here");

    const amountA = currentAmount;
    let amountB = new BigNumber(amountA).multipliedBy(ratio);
    amountB = BigInt(amountB);
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
  const value1 = 50;
  const transactionVolume = simulatePoissonProcess(lambda, duration);
  const assetRatios = randomWalk(1.8, 0.004, 200);
  const value2 = assetRatios[0];
  console.log(assetRatios.length);
  console.log(transactionVolume.length);
  let regularDeposits = {}; //dictionary that will store array  [[amountA, priceA], [amountB, priceB]] for each user
  const accounts = await ethers.getSigners();
  const extraproviders = accounts.slice(1, 3);

  // //provide some amount of liquidity with these accounts
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
  // // //deposits setup
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
  for (let i = 0; i < assetRatios.length; i++) {
    const currentRatio = assetRatios[i];
    const currentVolume = transactionVolume[i];
    const currentvalue2 = assetRatios[i];
    for (let j = 0; j < currentVolume; j++) {
      // console.log(j);
      //pick a random value from signers
      const randomIndex = Math.floor(Math.random() * signers1.length);
      const account = signers1[randomIndex];
      const regular = regularswap1.connect(account);
      const current_swap2 = regularswap2.connect(account);
      const current_liquidityPool = regularPool.connect(account);

      const randomIndex2 = Math.floor(Math.random() * signers2.length);
      const account2 = signers2[randomIndex2];


      await smartSwap(
        currentRatio,
        current_swap1,
        current_swap2,
        current_liquidityPool,
        account
      );
      break;
    }
    break;
  }
};

await main();