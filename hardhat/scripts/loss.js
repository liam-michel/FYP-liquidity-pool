import pkg from 'hardhat';
const  {ethers} = pkg;
import BigNumber from 'bignumber.js';

const SwapTokenFactory = await ethers.getContractFactory('SwapToken');
const LpTokenFactory = await ethers.getContractFactory('LpToken');
const LiquidityPoolFactory = await ethers.getContractFactory('LiquidityPool');
//if external price is cheaper, buy external and sell to internal
//if external is more expensive, buy internal and sell to external


function swap_calculation(countIn, inReserve, outReserve) {
  // Create BigNumber instances
  const countInBN = new BigNumber(countIn);
  const inReserveBN = new BigNumber(inReserve);
  const outReserveBN = new BigNumber(outReserve);

  // Calculate countIn with fee (0.3%)
  const countInWithFee = countInBN.times(997).div(1000);

  // Calculate dy = ydx / (x + dx)
  const amountOut = outReserveBN.times(countInWithFee).div(inReserveBN.plus(countInWithFee));

  return amountOut;
}

async function arbitrage_calculation(external_ratio, pool, tokenIn, amountIn) {
  const reserve1 = await pool.token1_reserve();
  const reserve2 = await pool.token2_reserve();
  const internal_ratio = Number(reserve1) / Number(reserve2);
  console.log('Internal ratio: ', internal_ratio);
  console.log('External ratio: ', external_ratio);
  if (internal_ratio < external_ratio && tokenIn == 'B') {
    // Internal market has a higher price for Token A: Buy A for B, sell it to the pool
    console.log('Token A is more expensive inside, buying A external and selling it to the pool ');
    //buy token A for B
    const input_price = amountIn * external_ratio;
    console.log(`Bought ${input_price} token A externally for ${amountIn} token B`);
    const calculated_out = swap_calculation(input_price, reserve1, reserve2);
    console.log("Token B received from smart contract: ", calculated_out);
    const profit = Number(calculated_out) - amountIn
    console.log(`Total profit of ${profit} token B`);
    return profit;

  }
  //internal market has lower price for token A, so buy token A from pool and sell externally
  if(internal_ratio > external_ratio && tokenIn == 'B'){
    console.log("Token A is cheaper inside, buy token A from pool and sell externally");
    const amountOut_A = swap_calculation(amountIn, reserve2, reserve1);
    console.log(`Bought ${Number(amountOut_A)} token A from pool for ${amountIn} token B`);
    //sell it to external market
    const output_price = Number(amountOut_A) / external_ratio;
    console.log("Sold token A externally for ", output_price)
    const profit = output_price - amountIn;
    console.log(`Total profit of ${profit} token B`);
    return profit;

  }
  //internal market has higher price for A, so lower price for B. Buy B internally and sell it to the pool
  if(internal_ratio < external_ratio && tokenIn == 'A'){
    console.log("Token B is cheaper inside, buy token B from pool and sell externally");
    const amountOut_B = swap_calculation(amountIn, reserve1, reserve2);
    console.log(`Bought ${Number(amountOut_B)} token B from pool for ${amountIn} token A`);
    //sell it to external market
    const output_price = Number(amountOut_B) * external_ratio;
    console.log(`Sold ${amountOut_B} token B externally for ${output_price} token A`);
    const profit = output_price - amountIn;
    console.log('Total profit of ', profit);
    return profit;

  }
  if(internal_ratio > external_ratio && tokenIn == 'A'){
    console.log("Token B is more expensive inside, buy token B externally and sell it to the pool");
    const amountOut_B = amountIn / external_ratio;
    console.log(`Bought ${amountOut_B} token B externally for ${amountIn} token A`);
    const output_price = swap_calculation(Math.floor(amountOut_B), reserve2, reserve1);
    console.log(`Sold ${amountOut_B} token B to pool for ${output_price} token A`);
    const profit = Number(output_price) - amountIn;
    console.log(`Total profit of ${profit} token A`)
    return profit;

  }else{
    console.error("No arbitrage opportunity here")
  }
}

const [owner] = await ethers.getSigners();
//setup pool etc
const swap1 = await SwapTokenFactory.deploy(0, 'SwapToken1', 'SWP1');
const swap2 = await SwapTokenFactory.deploy(0, 'SwapToken2', 'SWP2');
const lpToken = await LpTokenFactory.deploy(0, 'LpToken', 'LP');  
const liquidityPool = await LiquidityPoolFactory.deploy(swap1, swap2, lpToken); 
await lpToken.transferOwnership(liquidityPool);

await swap1.mint(10000, {from: owner.address});
await swap2.mint(15000, {from: owner.address});

await swap1.approve(liquidityPool, 10000, {from: owner.address});
await swap2.approve(liquidityPool, 15000, {from: owner.address});
await liquidityPool.addLiquidity(10000, 15000, 0, { from: owner.address});  


const external = 480/750;
const profit = await arbitrage_calculation(external, liquidityPool, 'A', 100);
if(profit > 0){
  console.log('profitable trade!')
}else{
  console.log('not worth doing a trade here')
}