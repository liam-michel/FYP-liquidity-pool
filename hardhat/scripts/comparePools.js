//purpose of this file is to compare the effectiveness of the regular
//AMM and my variable transaction fee implementation at addressing impermamanent loss

const {ethers} = pkg;
const {parseEther} = ethers;
const SwapTokenFactory = await ethers.getContractFactory('SwapToken');
const LpTokenFactory = await ethers.getContractFactory('LpToken');
const LiquidityPoolFactory = await ethers.getContractFactory('LiquidityPool');
const DynamicLiquidityPoolFactory = await ethers.getContractFactory('DynamicLiquidityPool');


const setupLiquidityPool = async() => {
  const signers = await ethers.getSigners();
  const [owner, second] = signers;
  //setup the pool and seed it with initial liquidity
  const swap1 = await SwapTokenFactory.deploy(0, 'SwapToken1', 'SWP1');
  const swap2 = await SwapTokenFactory.deploy(0, 'SwapToken2', 'SWP2');
  const lpToken = await LpTokenFactory.deploy(0, 'LpToken', 'LP');  
  const liquidityPool = await LiquidityPoolFactory.deploy(swap1, swap2, lpToken); 
  await lpToken.transferOwnership(liquidityPool);
  const initialA = parseEther("100000");
  const initialB = parseEther("50000");
  await swap1.mint(initialA, {from: owner.address});
  await swap2.mint(initialB, {from: owner.address});
  
  await swap1.approve(liquidityPool, initialA, {from: owner.address});
  await swap2.approve(liquidityPool, initialB, {from: owner.address});
  await liquidityPool.addLiquidity(initialA, initialB, 0, { from: owner.address});  
  return [swap1, swap2, lpToken, liquidityPool];
}


//main function
const main = async() => {

}