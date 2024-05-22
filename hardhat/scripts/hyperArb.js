import pkg from "hardhat";
import BigNumber from "bignumber.js";
import { simulatePoissonProcess, randomWalk } from "./evaluationHelpers.js";
import { writeResultsToFile } from "../helpers.js";

const { ethers } = pkg;
const { parseEther } = ethers;
import {
  optimalXin,
  optimalXout,
  optimalYin,
  optimalYout,
} from "./optArbCalcs.js";
import { assert } from "ethers";
const SwapTokenFactory = await ethers.getContractFactory("SwapToken");
const LpTokenFactory = await ethers.getContractFactory("LpToken");
const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");

const VariableLiquidityPoolFactory = await ethers.getContractFactory(
  "VariableLiquidityPool"
);

function getRandomInt(min, max) {
  min = BigInt(Math.ceil(Number(min)));
  max = BigInt(Math.floor(Number(max)));

  return (
    BigInt(Math.floor(Math.random() * (Number(max) - Number(min) + 1))) + min
  );
}

const resetBalances = async (swaps, account) => {
  for (let i = 0; i < swaps.length; i++) {
    const [token1, token2] = swaps[i];
    const balance1 = await token1.balanceOf(account);
    const balance2 = await token2.balanceOf(account);
    await token1.burn(balance1);
    await token2.burn(balance2);
    const newBalance1 = await token1.balanceOf(account);
    const newBalance2 = await token2.balanceOf(account);
  }
};

function calculatePercentageDifference(ratio1, ratio2) {
  const bigNumberRatio1 = BigNumber(ratio1);
  const bigNumberRatio2 = BigNumber(ratio2);
  const difference = bigNumberRatio1.minus(bigNumberRatio2);
  const percentageDifference = Math.abs(
    difference.dividedBy(bigNumberRatio1).times(100)
  );
  return percentageDifference;
}

const newArbitrage = async (pools, swaps, account, external_ratio) => {
  //iterate over each pool

  const regularPool = pools[0];
  const [token1, token2] = swaps[0];
  const internal_ratio = await regularPool.getReserveRatio();
  const external_ratio_scaled = BigInt(external_ratio * 1e18);
  const token1_reserve = await regularPool.token1_reserve();
  const token2_reserve = await regularPool.token2_reserve();

  const product = token1_reserve * token2_reserve;
  const tokenChoice = Math.random() > 0.5 ? token1 : token2;
  const tokenSymbol = await tokenChoice.symbol();

  //decide whether to arbitrage or regular trade
  const percentageDifference = calculatePercentageDifference(
    internal_ratio,
    external_ratio_scaled
  );
  const enoughDifference = percentageDifference > 0.01 ? true : false;

  let doArbitrage = true;
  doArbitrage = doArbitrage && enoughDifference;

  //alligned
  if (
    internal_ratio > external_ratio_scaled &&
    tokenSymbol == "B" &&
    doArbitrage
  ) {
    //user has B so we buy A externally and sell to the pool
    //console.log('internal_ratio > external_ratio && userToken == "B"');
    //optimal amount of A to put into the pool
    const optimalAmountA = await optimalXin(
      external_ratio,
      regularPool,
      token1,
      token2
    );

    //This is the amount of B that we need to buy 'optimal' amount of A
    //should mint
    const optimalB = BigInt(
      Math.floor(BigNumber(optimalAmountA).multipliedBy(external_ratio))
    );

    const chosenAmount = optimalB;

    ////////console.log("chosenAmount: ", chosenAmount);
    //purchase the amount of the token from the external market
    const amountAExternal = BigInt(
      Math.floor(BigNumber(chosenAmount).dividedBy(external_ratio))
    );

    for (let i = 0; i < pools.length; i++) {
      const currentPool = pools[i];
      const [token1, token2] = swaps[i];
      //mint the appropriate amount of tokens
      await token1.mint(amountAExternal);
      await token2.mint(chosenAmount);
      const oldABalance = await token1.balanceOf(account);
      const oldBBalance = await token2.balanceOf(account);
      //////console.log("Old token B Balance: ", oldBBalance);
      //MINT AMOUNT OF A TO THE USER SO THEY CAN SWAP INTO THE POOL

      await token1.approve(currentPool, amountAExternal);
      await currentPool.swap(token1, amountAExternal);
      //burn the amount of token B that was used to buy token A
      await token2.burn(chosenAmount);
      if (doArbitrage) {
        const newBBalance = await token2.balanceOf(account);
        //////console.log(`New token B Balance:  ${newBBalance}`);
        const profit = newBBalance - oldBBalance;
        //////console.log("Total token B profit: ", profit);
      }
    }
  }

  //alligned
  //A cheaper inside the pool, buy from the pool and sell external
  else if (
    internal_ratio < external_ratio_scaled &&
    tokenSymbol == "B" &&
    doArbitrage
  ) {
    //console.log('internal_ratio < external_ratio_scaled && userToken == "B"');
    //Optimal amount of X to remove from the pool
    const optimalXOut = await optimalXout(
      external_ratio,
      regularPool,
      token1,
      token2
    );

    const newX = BigNumber(token1_reserve) - BigNumber(optimalXOut);
    const newY = BigNumber(product) / newX;
    const optY = BigInt(Math.floor(newY - BigNumber(token2_reserve)));
    ////////console.log("Optimal amount of y to add in: ", optY);
    //optY is the optimal amount of Y to add into the pool

    const chosenAmount = optY;

    //chosenAmount is the amount of Y that we are going to add into the pool

    for (let i = 0; i < pools.length; i++) {
      const currentPool = pools[i];
      const [token1, token2] = swaps[i];

      //now with chosen amount of Y, buy A from the pool
      //mint amount of token Y to the user
      await token2.mint(chosenAmount);
      const oldABalance = await token1.balanceOf(account);
      const oldBBalance = await token2.balanceOf(account);
      await token2.approve(currentPool, chosenAmount);
      //execute the swap Y -> X
      await currentPool.swap(token2, chosenAmount);
      if (doArbitrage) {
        const new_abal = await token1.balanceOf(account);
        const difference = new_abal - oldABalance;
        //sell the difference to the external market (do this by converting with ratio, minting the converted amount and burning the original amount)
        const amountBExternal = BigInt(
          Math.floor(BigNumber(difference).multipliedBy(external_ratio))
        );
        await token2.mint(amountBExternal);
        //sell the token A for token B (to external market) (do a conversion);
        const newBBalance = await token2.balanceOf(account);
        const profit = newBBalance - oldBBalance;
        //////console.log("Total token B profit: ", profit);
      }
    }
  }

  //A cheaper inside so B is more expensive inside
  //Buy B externally (for A) and sell to the pool

  //Buy Token B external, sell to the pool
  else if (
    internal_ratio < external_ratio_scaled &&
    tokenSymbol == "A" &&
    doArbitrage
  ) {
    //console.log('internal_ratio < external_ratio_scaled && userToken == "A"');
    //optimal amount of B to trade into the pool
    const optimalB = await optimalYin(
      external_ratio,
      regularPool,
      token1,
      token2
    );

    const chosenAmount = optimalB;

    //amount of B that we have purchased for our A tokens
    const amountBExternal = BigInt(
      Math.floor(BigNumber(chosenAmount).multipliedBy(external_ratio))
    );
    //////console.log(typeof chosenAmount, typeof external_ratio);
    const amountAExternal = BigInt(
      Math.floor(BigNumber(chosenAmount).dividedBy(external_ratio))
    );
    //amountBExternal is the amount of B that we have purchased from the external market with our A
    for (let i = 0; i < pools.length; i++) {
      const currentPool = pools[i];
      const [token1, token2] = swaps[i];
      await token1.mint(amountAExternal);

      const oldABalance = await token1.balanceOf(account);
      await token2.mint(amountBExternal);
      await token1.burn(amountAExternal);
      await token2.approve(currentPool, amountBExternal);
      await currentPool.swap(token2, amountBExternal);
      if (doArbitrage) {
        const newABalance = await token1.balanceOf(account);
        const profit = newABalance - oldABalance;
        //////console.log("Total token A profit: ", profit);
      }
    }
  }

  //Higher A, lower B internal.
  // Buy B from the pool and sell external
  else if (
    internal_ratio > external_ratio_scaled &&
    tokenSymbol == "A" &&
    doArbitrage
  ) {
    //////console.log('internal_ratio > external_ratio_scaled && userToken == "A"');
    //this is the optimal amount of B to remove from the pool
    const optimalB = await optimalYout(
      external_ratio,
      regularPool,
      token1,
      token2
    );
    //console.log("Optimal amount of Y to swap out: ", optimalB);
    const newB = BigNumber(token2_reserve) - BigNumber(optimalB);
    const newA = BigNumber(product) / newB;
    const optA = BigInt(Math.floor(newA - BigNumber(token1_reserve)));
    //optimal amount of X to put into the pool
    //////console.log("Amount of X to put in: ", optA);

    const chosenAmount = optA;

    //chosenAmount is the amount of X that we are going to put into the pool
    for (let i = 0; i < pools.length; i++) {
      const currentPool = pools[i];
      const [token1, token2] = swaps[i];
      await token1.mint(chosenAmount);
      const oldABalance = await token1.balanceOf(account);
      const oldBBalance = await token2.balanceOf(account);
      await token1.approve(currentPool, chosenAmount);
      await currentPool.swap(token1, chosenAmount);
      if (doArbitrage) {
        const new_bbal = await token2.balanceOf(account);
        const difference = new_bbal - oldBBalance;
        //sell the difference to the external market (do this by converting with ratio, minting the converted amount and burning the original amount)
        const amountAExternal = BigInt(
          Math.floor(BigNumber(difference).dividedBy(external_ratio))
        );
        await token1.mint(amountAExternal);
        //await token2.burn(difference);

        //sell the token B
        const newABalance = await token1.balanceOf(account);
        //////console.log("New A balance: ", newABalance);
        const profit = newABalance - oldABalance;
        //////console.log("Total token A profit: ", profit);
      }
    }
  } else {
    //console.log("no arb, random swap");
    //calculate a percentage between 1 and 10 , we will swap this
    const percentage = (Math.random() + Math.random()) / 100; //constrain the value between 0 and 0.1;
    const reserve = tokenChoice == token1 ? token1_reserve : token2_reserve;
    const amount = BigInt(
      Math.floor(BigNumber(reserve).multipliedBy(percentage).dividedBy(100))
    );

    for (let i = 0; i < pools.length; i++) {
      const currentPool = pools[i];
      const [token1, token2] = swaps[i];
      const swapToken = reserve == token1_reserve ? token1 : token2;
      await swapToken.mint(amount);
      await swapToken.approve(currentPool, amount);
      await currentPool.swap(swapToken, amount);
    }
  }
  await resetBalances(swaps, account);
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

const setupVariableLiquidityPool = async () => {
  const swap1 = await SwapTokenFactory.deploy(0n, "SwapToken1", "A");
  const swap2 = await SwapTokenFactory.deploy(0n, "SwapToken2", "B");
  const lpToken = await LpTokenFactory.deploy(0n, "LpToken", "LP");
  const liquidityPool = await VariableLiquidityPoolFactory.deploy(
    swap1,
    swap2,
    lpToken
  );
  await lpToken.transferOwnership(liquidityPool);
  return [swap1, swap2, lpToken, liquidityPool];
};

const seedLiquidities = async (swap1, swap2, liquidityPool) => {
  const initialA = parseEther("500000");
  const initialB = parseEther("1000000");
  await swap1.mint(initialA);
  await swap2.mint(initialB);

  await swap1.approve(liquidityPool, initialA);
  await swap2.approve(liquidityPool, initialB);
  await liquidityPool.addLiquidity(initialA, initialB, 0);
};
const calculateProduct = (reserve1, reserve2) => {
  const product = reserve1 * reserve2;
  ////////console.log("Product is :", product);
  return product;
};

const removeLiquidity = async (liquidityPool, lptoken, accounts) => {
  for (const account of accounts) {
    const current_liquidityPool = liquidityPool.connect(account);
    const current_lptoken = lptoken.connect(account);
    const shares = await current_lptoken.balanceOf(account);
    await current_liquidityPool.removeLiquidity(shares);
  }
};

const addLiquidityForPool = async (
  swap1,
  swap2,
  liquidityPool,
  account,
  amountA,
  amountB,
  valueA,
  valueB
) => {
  const current_swap1 = swap1.connect(account);
  const current_swap2 = swap2.connect(account);
  const current_liquidityPool = liquidityPool.connect(account);

  await current_swap1.mint(amountA);
  await current_swap2.mint(amountB);
  await current_swap1.approve(liquidityPool, amountA);
  await current_swap2.approve(liquidityPool, amountB);

  await current_liquidityPool.addLiquidity(amountA, amountB, 5);
  //calculate value of amountA and amountB according to external ratio
  const newDeposit = [
    [amountA, valueA],
    [amountB, valueB],
  ];
  return newDeposit;

  //add the deposit to the deposits dictionary
};

const addLiquidityMultiplePools = async (
  swaps,
  pools,
  accounts,
  ratio,
  valueA,
  valueB
) => {
  //generate some amounts
  ////////console.log("value of token A: ", valueA);
  ////////console.log("value of token B: ", valueB);
  const lowerBound = ethers.parseEther("20000");
  const upperBound = ethers.parseEther("100000");
  const amounts = generateAmounts(accounts.length, lowerBound, upperBound);
  let all_deposits = {};
  ////////console.log(accounts.length);
  ////////console.log(pools.length);
  //iterate over pools and then accounts
  for (let i = 0; i < pools.length; i++) {
    const current_pool = pools[i];
    const current_swap1 = swaps[i][0];
    const current_swap2 = swaps[i][1];
    //create a new deposits subdictionary for each pool
    let pool_deposits = {};
    for (let j = 0; j < accounts.length; j++) {
      const current_account = accounts[j];
      const current_amount = amounts[j];
      const current_pool_ratio = await current_pool.getReserveRatio();
      const down_ratio = BigNumber(current_pool_ratio).dividedBy(1e18);
      const amountA = current_amount;
      const amountB = BigInt(
        Math.floor(BigNumber(amountA).multipliedBy(down_ratio))
      );
      const account_deposit = await addLiquidityForPool(
        current_swap1,
        current_swap2,
        current_pool,
        current_account,
        amountA,
        amountB,
        valueA,
        valueB
      );
      pool_deposits[current_account.address] = account_deposit;
    }
    all_deposits[i] = pool_deposits;
  }

  return all_deposits;
};

const calculateImpermanentLoss = async (pools, swaps, all_deposits, ratio) => {
  //dict to store aggregated results from all pools
  //console.log("Pool Count: ", pools.length);
  const results = {};
  for (let i = 0; i < pools.length; i++) {
    //console.log("NEW POOL \n\n");
    const current_pool = pools[i];
    const deposits = all_deposits[i];
    const [token1, token2] = swaps[i];
    const reserve1 = await current_pool.token1_reserve();
    const reserve2 = await current_pool.token2_reserve();
    ////console.log("Reserve1: ", reserve1.toString());
    ////console.log("Reserve2: ", reserve2.toString());
    const accounts = Object.keys(deposits);
    for (const account of accounts) {
      const deposit = deposits[account];
      const amountA = deposit[0][0];
      const amountB = deposit[1][0];
      //console.log("Old Amounts");

      const costA = deposit[0][1];
      const costB = deposit[1][1];
      //console.log("Old amount A: ", amountA.toString());
      //console.log("Old amount B: ", amountB.toString());
      const oldRatio = BigNumber(amountB).dividedBy(amountA);
      //console.log("Old ratio: ", oldRatio.toString());
      //console.log("costA: ", costA.toString());
      //console.log("costB: ", costB.toString());
      const valueA = BigNumber(amountA).multipliedBy(costA);
      const valueB = BigNumber(amountB).multipliedBy(costB);
      const oldTotal = BigNumber(valueA).plus(valueB).dividedBy(1e18);
      //calculate new value of their deposit
      const newAmountA = await token1.balanceOf(account);
      const newAmountB = await token2.balanceOf(account);
      //console.log("New amount A: ", newAmountA.toString());
      //console.log("New amount B: ", newAmountB.toString());
      const newRatio = BigNumber(newAmountB).dividedBy(newAmountA);
      //console.log("New ratio: ", newRatio.toString());
      const newValueA = BigNumber(newAmountA).multipliedBy(costA);
      const newValueB = BigNumber(newAmountB).multipliedBy(costB);
      const newTotal = BigNumber(newValueA).plus(newValueB).dividedBy(1e18);
      //console.log("Old total value: ", oldTotal.toString());
      //console.log("New total value: ", newTotal.toString());
      const difference = newTotal.minus(oldTotal);
      //add results to results object
      const newResult = {
        poolIndex: i,
        oldTotal: oldTotal.toString(),
        newTotal: newTotal.toString(),
        difference: difference.toString(),
        loss: difference.lt(0),
      };
      if (!results[account]) {
        results[account] = [];
      }
      results[account].push(newResult);
    }
  }
  return results;
};
const main = async () => {
  const lambda = 10;
  const duration = 400;
  //setup regular Liquidity Pool
  const [regularswap1, regularswap2, regularlpToken, regularPool] =
    await setupLiquidityPool();
  const [variableswap1, variableswap2, variablelpToken, variablePool] =
    await setupVariableLiquidityPool();
  await seedLiquidities(regularswap1, regularswap2, regularPool);
  await seedLiquidities(variableswap1, variableswap2, variablePool);
  const value1 = BigNumber(20);
  const transactionVolume = simulatePoissonProcess(lambda, duration);
  console.log(transactionVolume);
  const assetRatios = randomWalk(1.8, 0.03, 199);
  // const assetRatios = Array(400).fill(2);
  const initialRatio = assetRatios[0];
  const value2 = BigNumber(value1).dividedBy(initialRatio);

  const accounts = await ethers.getSigners();
  const providers = accounts.slice(1, 5);

  const swaps = [
    [regularswap1, regularswap2],
    [variableswap1, variableswap2],
  ];
  const pools = [regularPool, variablePool];
  const lpTokens = [regularlpToken, variablelpToken];

  const deposits = await addLiquidityMultiplePools(
    swaps,
    pools,
    providers,
    initialRatio,
    value1,
    value2
  );

  ////console.log(deposits);
  //this signer will be used for all swaps
  const signer = accounts[6];
  //setup tokens and pool for the signer
  const signerPools = pools.map((pool) => pool.connect(signer));
  const signerTokens = swaps.map((pair) =>
    pair.map((token) => token.connect(signer))
  );

  //run same set of transactions on both pools
  let transactionCounter = 0;
  for (let i = 0; i < assetRatios.length; i++) {
    const currentRatio = assetRatios[i];
    const currentVolume = transactionVolume[i];
    for (let j = 0; j < currentVolume; j++) {
      //pick a random value from signers
      transactionCounter += 1;
      if (transactionCounter % 2 == 0) {
        const variablePool = pools[1];
        await variablePool.setExternalRatio(BigInt(currentRatio * 1e18));
        ////console.log("set external ratio n");
      }
      await newArbitrage(signerPools, signerTokens, signer, currentRatio);
    }
  }

  // // remove liquidity from the pool
  for (let i = 0; i < pools.length; i++) {
    const current_pool = pools[i];
    const current_lpToken = lpTokens[i];
    //remove liquidity from this pool for all providers
    await removeLiquidity(current_pool, current_lpToken, providers);
  }

  const finalRatio = assetRatios[assetRatios.length - 1];
  //calculate loss / gain for the different pools
  const results = await calculateImpermanentLoss(
    pools,
    swaps,
    deposits,
    finalRatio
  );

  writeResultsToFile(results, "./transResults");
};
await main();
