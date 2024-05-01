import pkg from "hardhat";
const { ethers } = pkg;
const { parseEther } = ethers;
const SwapTokenFactory = await ethers.getContractFactory("SwapToken");
const LpTokenFactory = await ethers.getContractFactory("LpToken");
const LiquidityPoolFactory = await ethers.getContractFactory(
  "DynamicLiquidityPool"
);

//THIS FILE CONTAINS TRADES WITH THE REGULAR LIQUIDITY POOL THAT ASSUMES NO IMPERMANENT LOSS AND RANDOM TRADES

const calculate_value = (countA, countB, ratio) => {
  const scale = 1e18;
  const scaled_ratio = BigInt(ratio * scale);
  const scaled_output = countA * scaled_ratio + countB * BigInt(scale);
  const transed = BigInt(scaled_output / BigInt(scale));
  return transed;
};

function getRandomInt(min, max) {
  min = BigInt(Math.ceil(Number(min)));
  max = BigInt(Math.floor(Number(max)));
  return (
    BigInt(Math.floor(Math.random() * (Number(max) - Number(min) + 1))) + min
  );
}

const mintTokensAll = async (token1, token2, signers) => {
  for (let i = 0; i < signers.length; i++) {
    const current_signer = signers[i];
    //connect current signer to contract
    const current_token1 = token1.connect(current_signer);
    const current_token2 = token2.connect(current_signer);
    //mint 100 of token1 and token2 to them
    await current_token1.mint(parseEther("100"));
    await current_token2.mint(parseEther("100"));
  }
};

const randomSwapsAll = async (token1, token2, pool, signers) => {
  for (let j = 0; j < 300; j++) {
    for (let i = 0; i < signers.length; i++) {
      const current_signer = signers[i];
      const token_choice = Math.random() > 0.5 ? token1 : token2;
      const token_symbol = await token_choice.symbol();
      const userBalance = await token_choice.balanceOf(current_signer.address);
      const amount = getRandomInt(1, userBalance);

      //console.log(`Swapping ${amount} of ${token_symbol}`)
      //connect with current_signer
      const current_pool = pool.connect(current_signer);
      const current_token_choice = token_choice.connect(current_signer);

      await current_token_choice.approve(current_pool, amount);
      await current_pool.swap(current_token_choice, amount);
    }
  }
};

const runSwaps = async () => {
  const signers = await ethers.getSigners();
  const [owner, second] = signers;
  //setup the pool and seed it with initial liquidity
  const swap1 = await SwapTokenFactory.deploy(0, "SwapToken1", "SWP1");
  const swap2 = await SwapTokenFactory.deploy(0, "SwapToken2", "SWP2");
  const lpToken = await LpTokenFactory.deploy(0, "LpToken", "LP");
  const liquidityPool = await LiquidityPoolFactory.deploy(
    swap1,
    swap2,
    lpToken
  );
  await lpToken.transferOwnership(liquidityPool);
  const initialA = parseEther("100000");
  const initialB = parseEther("50000");
  await swap1.mint(initialA, { from: owner.address });
  await swap2.mint(initialB, { from: owner.address });

  await swap1.approve(liquidityPool, initialA, { from: owner.address });
  await swap2.approve(liquidityPool, initialB, { from: owner.address });
  await liquidityPool.addLiquidity(initialA, initialB, 0, {
    from: owner.address,
  });

  //have a 2nd user deposit some liquidity in a matching ratio
  //connect to contract again
  const secondAmountA = parseEther("10000");
  const secondAmountB = parseEther("5000");
  const second_swap1 = swap1.connect(second);
  const second_swap2 = swap2.connect(second);
  const second_lpToken = lpToken.connect(second);
  const second_pool = liquidityPool.connect(second);
  await second_swap1.mint(secondAmountA);
  await second_swap2.mint(secondAmountB);

  const oldABalance = await second_swap1.balanceOf(second.address);
  const oldBBalance = await second_swap2.balanceOf(second.address);
  console.log("Balance before trades");
  console.log(oldABalance);
  console.log(oldBBalance);
  console.log(
    "Value before trades: ",
    calculate_value(oldABalance, oldBBalance, 2)
  );

  await second_swap1.approve(second_pool, secondAmountA);
  await second_swap2.approve(second_pool, secondAmountB);
  await second_pool.addLiquidity(secondAmountA, secondAmountB, 0);

  //mint tokens to everybody other than the first two
  await mintTokensAll(swap1, swap2, signers.slice(2));
  await randomSwapsAll(swap1, swap2, liquidityPool, signers.slice(2));
  //now withdraw the liquidity from the
  const second_shares = await second_lpToken.balanceOf(second.address);
  await second_pool.removeLiquidity(second_shares);
  const second_swap1_balance = await second_swap1.balanceOf(second.address);
  const second_swap2_balance = await second_swap2.balanceOf(second.address);
  console.log("Balance after trades");
  console.log(second_swap1_balance);
  console.log(second_swap2_balance);
  console.log(
    "Value after trades: ",
    calculate_value(second_swap1_balance, second_swap2_balance, 2)
  );
};

await runSwaps();
