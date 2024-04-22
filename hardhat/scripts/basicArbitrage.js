import pkg from 'hardhat';
const { ethers } = pkg;
import { onChainSwapCalc, externalBuyA, externalSellA } from '../helpers.js';
const SwapTokenFactory = await ethers.getContractFactory('SwapToken');
const LpTokenFactory = await ethers.getContractFactory('LpToken');
const LiquidityPoolFactory = await ethers.getContractFactory('LiquidityPool');


async function arbitrage_calculation(external_ratio, pool, tokenIn, amountIn) {
  const reserve1 = await pool.token1_reserve();
  const reserve2 = await pool.token2_reserve();
  const internal_ratio = Number(reserve2) / Number(reserve1); // Floor division
  console.log('Internal ratio: ', internal_ratio);
  console.log('External ratio: ', external_ratio.toString());


  // Internal market has a higher price for Token A: Buy A for B, sell it to the pool
  if (internal_ratio > external_ratio && tokenIn == 'B') {
    console.log('Token A is more expensive inside, buying A external and selling it to the pool ');
    //buy token A for B
    const initial_purchase = externalBuyA(amountIn, external_ratio);

    console.log(`Bought ${initial_purchase} token A externally for ${amountIn} token B`);
    const calculated_out = await onChainSwapCalc(initial_purchase, 3, reserve1, reserve2);
    console.log("Token B received from smart contract: ", calculated_out);
    const profit = calculated_out - amountIn;
    console.log(`Total profit of ${profit} token B`);
    return profit;

  }
  //internal market has lower price for token A, so buy token A from pool and sell externally
  if(internal_ratio < external_ratio && tokenIn == 'B'){
    console.log("Token A is cheaper inside, buy token A from pool and sell externally");
    const amountOut_A = await onChainSwapCalc(amountIn, 3, reserve2, reserve1);
    console.log(`Bought ${Number(amountOut_A)} token A from pool for ${amountIn} token B`);
    //sell it to external market
    const output_price = externalSellA(amountOut_A, external_ratio);
    console.log("Sold token A externally for ", output_price)
    const profit = output_price - amountIn;
    console.log(`Total profit of ${profit} token B`);
    const newInternalReserve1 = await pool.token1_reserve();
    const newInternalReserve2 = await pool.token2_reserve();
    const newInternalRatio = Number(newInternalReserve2) / Number(newInternalReserve1);
    console.log('New internal ratio: ', newInternalRatio);
    return profit;

  }
  //internal market has higher price for A, so lower price for B. Buy B internally and sell it to external market
  if(internal_ratio > external_ratio && tokenIn == 'A'){
    console.log("Token B is cheaper inside, buy token B from pool and sell externally");
    //buy token B from the pool
    const amountOut_B = await onChainSwapCalc(amountIn, 3, reserve2 , reserve2);
    console.log(`Bought ${Number(amountOut_B)} token B from pool for ${amountIn} token A`);
    //sell it to external market (Buy A for B)
    const output_price = externalBuyA(amountOut_B, external_ratio);
    console.log(`Sold ${amountOut_B} token B externally for ${output_price} token A`);
    const profit = output_price - amountIn;
    console.log('Total profit of ', profit);
    return profit;

  }
  if(internal_ratio < external_ratio && tokenIn == 'A'){
    console.log("Token B is more expensive inside, buy token B externally and sell it to the pool");
    const amountOut_B = onChainSwapCalc(amountIn, 3, reserve2, reserve1) ;
    console.log(`Bought ${amountOut_B} token B externally for ${amountIn} token A`);
    const output_price = BigInt(onChainSwapCalc(amountOut_B, reserve2, reserve1));
    console.log(`Sold ${amountOut_B} token B to pool for ${output_price} token A`);
    console.log(typeof output_price);
    console.log(typeof amountIn);
    const profit = output_price - amountIn;
    console.log(`Total profit of ${profit} token A`)
    return profit;

  }else{
    console.error("No arbitrage opportunity here")
  }
}
const [owner] = await ethers.getSigners();
const swap1 = await SwapTokenFactory.deploy(0n, 'SwapToken1', 'SWP1');
const swap2 = await SwapTokenFactory.deploy(0n, 'SwapToken2', 'SWP2');
const lpToken = await LpTokenFactory.deploy(0n, 'LpToken', 'LP');  
const liquidityPool = await LiquidityPoolFactory.deploy(swap1, swap2, lpToken); 
await lpToken.transferOwnership(liquidityPool);

const a_amount = 10000000n;
const b_amount = 15000000n;
await swap1.mint(a_amount, {from: owner.address});
await swap2.mint(b_amount, {from: owner.address});

await swap1.approve(liquidityPool, a_amount, {from: owner.address});
await swap2.approve(liquidityPool, b_amount, {from: owner.address});
await liquidityPool.addLiquidity(a_amount, b_amount,  0, { from: owner.address});  

const external = 800/500; // Using BigInt for ratio

const profit = await arbitrage_calculation(external, liquidityPool, 'B', 10000n); // Use BigInt for amountIn
if (profit > 0n) {
  console.log('profitable trade!')
} else {
  console.log('not worth doing a trade here')
}
