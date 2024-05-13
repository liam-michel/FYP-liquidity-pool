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
import { electronMassDependencies } from "mathjs";
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

const executeArbitrage = async (
  external_ratio,
  token1,
  token2,
  liquidityPool,
  userChoice,
  signer
) => {
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
  //console.log("Old token A balance: ", oldABalance);
  //console.log("Old token B balance: ", oldBBalance);
  const down_internal_ratio = BigNumber(internal_ratio).dividedBy(1e18);
  //console.log("Internal ratio: ", down_internal_ratio);
  //console.log("External ratio: ", external_ratio);
  const userToken = await userChoice.symbol();
  const userBalance = await userChoice.balanceOf(signer);

  //user has B
  //A more expensive inside. Buy A external, sell to pool
  if (internal_ratio > external_ratio_scaled && userToken == "B") {
    //user has B so we buy A externally and sell to the pool
    //console.log('internal_ratio > external_ratio && userToken == "B"');
    const optimalAmountA = await optimalXin(
      external_ratio,
      liquidityPool,
      token1,
      token2
    );
    //console.log("Optimal amount of A to swap into the pool: ", optimalAmountA);
    //purchase this amount of the token from the external market
    const optimalB = BigInt(
      Math.floor(BigNumber(optimalAmountA).multipliedBy(external_ratio))
    );
    //check if the user balance is < the optimal amount
    let chosenAmount;
    if (userBalance < optimalB) {
      //console.log("User balance is less than the optimal amount");
      chosenAmount = getRandomInt(userBalance / BigInt(2), userBalance);
      //pick a value that is between userBalance /2 , userBalance
    } else {
      chosenAmount = getRandomInt(userBalance / BigInt(2), optimalB);
    }
    //console.log("chosenAmount: ", chosenAmount);
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
    //console.log("Total token B profit: ", profit);
    return true;
  }

  //A cheaper inside the pool, buy from the pool and sell external
  else if (internal_ratio < external_ratio_scaled && userToken == "B") {
    //console.log('internal_ratio < external_ratio_scaled && userToken == "B"');
    const optimalB = await optimalXout(
      external_ratio,
      liquidityPool,
      token1,
      token2
    );
    const newX = BigNumber(token1_reserve) - BigNumber(optimalB);
    const newY = BigNumber(product) / newX;
    const optY = BigInt(Math.floor(newY - BigNumber(token2_reserve)));
    //console.log("Optimal amount of y to add in: ", optY);

    let chosenAmount;

    if (userBalance < optY) {
      //console.log("User balance is less than the optimal amount");
      chosenAmount = getRandomInt(userBalance / BigInt(2), userBalance);
    } else {
      chosenAmount = getRandomInt(userBalance / BigInt(2), optY);
    }
    //console.log("chosenAmount: ", chosenAmount);

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
    //console.log("Total token B profit: ", profit);
    return true;
  }

  //Buy Token B external, sell to the pool
  else if (internal_ratio < external_ratio_scaled && userToken == "A") {
    //console.log('internal_ratio < external_ratio_scaled && userToken == "A"');
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
    //console.log("chosenAmount: ", chosenAmount);

    const amountBExternal = BigInt(
      Math.floor(BigNumber(chosenAmount).multipliedBy(external_ratio))
    );
    await token2.mint(amountBExternal);
    await token1.burn(chosenAmount);
    await token2.approve(liquidityPool, amountBExternal);
    await liquidityPool.swap(token2, amountBExternal);
    const newABalance = await token1.balanceOf(signer);
    const profit = newABalance - oldABalance;
    //console.log("Total token A profit: ", profit);
    return true;
  }

  //Higher A, lower B internal. Buy B from the pool and sell external
  else if (internal_ratio > external_ratio_scaled && userToken == "A") {
    //console.log('internal_ratio > external_ratio_scaled && userToken == "A"');
    const optimalB = await optimalYout(
      external_ratio,
      liquidityPool,
      token1,
      token2
    );
    //console.log("Optimal amount of Y to swap out: ", optimalB);
    const newB = BigNumber(token2_reserve) - BigNumber(optimalB);
    const newA = BigNumber(product) / newB;
    const optA = BigInt(Math.floor(newA - BigNumber(token1_reserve)));
    //console.log("Amount of X to put in: ", optA);
    let chosenAmount;

    if (userBalance < optA) {
      chosenAmount = getRandomInt(userBalance / BigInt(2), userBalance);
    } else {
      chosenAmount = getRandomInt(userBalance / BigInt(2), optA);
    }
    //console.log("chosenAmount: ", chosenAmount);

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
    //console.log("New A balance: ", newABalance);
    const profit = newABalance - oldABalance;
    //console.log("Total token A profit: ", profit);
    return true;
  }
  return false;
};

const smartSwap = async (
  external_ratio,
  regular1,
  regular2,
  regularPool,
  dynamic1,
  dynamic2,
  dynamicPool,
  signer1,
  signer2
) => {
  //connect to token with relevant signers
  regular1 = regular1.connect(signer1);
  regular2 = regular2.connect(signer1);
  dynamic1 = dynamic1.connect(signer2);
  dynamic2 = dynamic2.connect(signer2);
  regularPool = regularPool.connect(signer1);
  dynamicPool = dynamicPool.connect(signer2);

  const regular_choice = Math.random() > 0.5 ? regular1 : regular2;
  const dynamic_choice = regular_choice == regular1 ? dynamic1 : dynamic2;

  //now evaluate if there is arbitrage opportunity
  //fetch internal reserves to evaluate internal ratio

  const doArbitrage = Math.random() > 0.5 ? true : false;
  if (doArbitrage) {
    //console.log("regular pool swap");
    const success1 = await executeArbitrage(
      external_ratio,
      regular1,
      regular2,
      regularPool,
      regular_choice,
      signer1
    );
    if (!success1) {
      //do a random swap if no arbitrage opportunity found / exploited
      await randomSwapBoth(
        regularPool,
        regular_choice,
        dynamicPool,
        dynamic_choice,
        signer1,
        signer2
      );
    }
    //console.log("dynamic pool swap");
    const success2 = await executeArbitrage(
      external_ratio,
      dynamic1,
      dynamic2,
      dynamicPool,
      dynamic_choice,
      signer2
    );
    if (!success2) {
      //do a random swap if no arbitrage opportunity found / exploited
      await randomSwapBoth(
        regularPool,
        regular_choice,
        dynamicPool,
        dynamic_choice,
        signer1,
        signer2
      );
    }
  } else {
    //perform random swap
    //console.log("Executing a random swap");
    await randomSwapBoth(
      regularPool,
      regular_choice,
      dynamicPool,
      dynamic_choice,
      signer1,
      signer2
    );
  }
};

const randomSwapBoth = async (
  regularPool,
  regularChoice,
  dynamicPool,
  dynamicChoice,
  signer1,
  signer2
) => {
  const balance1 = await regularChoice.balanceOf(signer1);
  const balance2 = await dynamicChoice.balanceOf(signer2);
  const amount1 = getRandomInt(balance1 / BigInt(10), balance1);
  const amount2 = getRandomInt(balance2 / BigInt(10), balance2);
  //approve transfers
  await regularChoice.approve(regularPool, amount1);
  await dynamicChoice.approve(dynamicPool, amount2);
  //swap
  await regularPool.swap(regularChoice, amount1);
  await dynamicPool.swap(dynamicChoice, amount2);
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

    await current_token1.mint(parseEther("5000"));
    await current_token2.mint(parseEther("5000"));
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
  //console.log("Product is :", product);
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
  //console.log("value of token A: ", valueA);
  //console.log("value of token B: ", valueB);
  const lowerBound = ethers.parseEther("10");
  const upperBound = ethers.parseEther("100");
  const amounts = generateAmounts(accounts.length, lowerBound, upperBound);
  let all_deposits = {};
  //console.log(accounts.length);
  //console.log(pools.length);
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

const calculateImpermanentLoss = async (
  deposits,
  token1,
  token2,
  ratio
) => {
  console.log('here')
  console.log(deposits)
  const accounts = Object.keys(deposits);
  for (const account of accounts) {
    const deposit = deposits[account];
    const amountA = deposit[0][0];
    const amountB = deposit[1][0];
    const costA = deposit[0][1];
    const costB = deposit[1][1];
    const valueA = BigNumber(amountA).multipliedBy(costA);
    const valueB = BigNumber(amountB).multipliedBy(costB);
    const oldTotal = BigNumber(valueA).plus(valueB);

    //calculate new value of their deposit
    const newAmountA = await token1.balanceOf(account);
    const newAmountB = await token2.balanceOf(account);
    const newValueA = BigNumber(newAmountA).multipliedBy(costA);
    const newValueB = BigNumber(newAmountB).multipliedBy(costB);
    const newTotal = BigNumber(newValueA).plus(newValueB);
    console.log("Old total value: ", oldTotal.toString());
    console.log("New total value: ", newTotal.toString());
    const difference = newTotal.minus(oldTotal);
    if(difference.lt(0)){
      console.log("Impermanent loss for account: ", difference.toString());
    }else{
      console.log("Gain for account: ", difference.toString());
    }
  };
};

const main = async () => {
  const lambda = 5;
  const duration = 200;
  //setup regular Liquidity Pool
  const [regularswap1, regularswap2, regularlpToken, regularPool] =
    await setupLiquidityPool();
  const [dynamicswap1, dynamicswap2, dynamiclpToken, dynamicPool] =
    await setupLiquidityPool();
  await seedLiquidities(regularswap1, regularswap2, regularPool);
  await seedLiquidities(dynamicswap1, dynamicswap2, dynamicPool);
  const value1 = 50;
  const transactionVolume = simulatePoissonProcess(lambda, duration);
  const assetRatios = randomWalk(2, 0.004, 199);
  const initialRatio = assetRatios[0];
  const value2 = BigNumber(value1).multipliedBy(initialRatio);
  //console.log(assetRatios.length);
  //console.log(transactionVolume.length);

  const accounts = await ethers.getSigners();
  const providers = accounts.slice(1, 5);

  const swaps = [
    [regularswap1, regularswap2],
    [dynamicswap1, dynamicswap2],
  ];
  const pools = [regularPool, dynamicPool];
  const lpTokens = [regularlpToken, dynamiclpToken];
  const oldReserve1 = await regularPool.token1_reserve();
  const oldReserve2 = await regularPool.token2_reserve();
  console.log("Old reserve1: ", oldReserve1.toString());  
  console.log("Old reserve2: ", oldReserve2.toString());

  // const deposits = await addLiquidityMultiplePools(
  //   swaps,
  //   pools,
  //   providers,
  //   initialRatio,
  //   value1,
  //   value2
  // );
  // console.log(deposits);

  // add 50/100 to the pool
  const newSigner = providers[0];
  const newtoken1 = regularswap1.connect(newSigner);
  const newtoken2 = regularswap2.connect(newSigner);
  const newRegularPool = regularPool.connect(newSigner);
  await newtoken1.mint(parseEther("500"));
  await newtoken2.mint(parseEther("1000"));
  await newtoken1.approve(newRegularPool, parseEther("500"));
  await newtoken2.approve(newRegularPool, parseEther("1000"));
  await newRegularPool.addLiquidity(parseEther("500"), parseEther("1000"), 5);

  const reserve1Afterdeposit = await regularPool.token1_reserve();
  const reserve2Afterdeposit = await regularPool.token2_reserve();
  console.log("Reserve1 after deposit: ", reserve1Afterdeposit.toString());
  console.log("Reserve2 after deposit: ", reserve2Afterdeposit.toString());
  //pick out deposits from pool1

  const signers1 = accounts.slice(5, 11);
  const signers2 = accounts.slice(11, 17);
  //mint an amount of all tokens to each user
  await mintTokensAll(regularswap1, regularswap2, signers1);
  await mintTokensAll(dynamicswap1, dynamicswap2, signers2);

  //run same set of transactions on both pools
  // for (let i = 0; i < assetRatios.length; i++) {
  //   const currentRatio = assetRatios[i];
  //   const currentVolume = transactionVolume[i];
  //   for (let j = 0; j < currentVolume; j++) {
  //     // //console.log(j);
  //     //pick a random value from signers
  //     const randomIndex = Math.floor(Math.random() * signers1.length);
  //     const account1 = signers1[randomIndex];

  //     const randomIndex2 = Math.floor(Math.random() * signers2.length);
  //     const account2 = signers2[randomIndex2];

  //     await smartSwap(
  //       currentRatio,
  //       regularswap1,
  //       regularswap2,
  //       regularPool,
  //       dynamicswap1,
  //       dynamicswap2,
  //       dynamicPool,
  //       account1,
  //       account2
  //     );
  //   }
  // }
  //remove liquidity from the pool
  // for(let i = 0; i < pools.length; i++){ 
  //   const current_pool = pools[i];
  //   const current_lpToken = lpTokens[i];
  //   //remove liquidity from this pool for all providers
  //   await removeLiquidity(current_pool, current_lpToken, providers);
  // }

  //withdraw liquidity one user 
  const userLP = lpTokens[0].connect(providers[0]);
  const balance = userLP.balanceOf(providers[0])
  await newRegularPool.removeLiquidity(balance);
  
  const reserve1afterwithdraw = await regularPool.token1_reserve();
  const reserve2afterwithdraw = await regularPool.token2_reserve();
  console.log("Reserve1 after withdraw: ", reserve1afterwithdraw.toString());
  console.log("Reserve2 after withdraw: ", reserve2afterwithdraw.toString());
  const finalRatio = assetRatios[0]
  console.log("first ratio: ", finalRatio)
  //calculate loss / gain for the different pools
  // for(let i = 0; i < pools.length; i++){
  //   const deposit = deposits[i];
  //   await calculateImpermanentLoss(deposit, swaps[i][0], swaps[i][1], finalRatio);
  // };
}
await main();
