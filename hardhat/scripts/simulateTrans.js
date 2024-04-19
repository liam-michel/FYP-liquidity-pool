import pkg from 'hardhat';
const {ethers} = pkg;

const SwapTokenFactory = await ethers.getContractFactory('SwapToken');
const LpTokenFactory = await ethers.getContractFactory('LpToken');
const LiquidityPoolFactory = await ethers.getContractFactory('LiquidityPool');


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const mintTokensAll = async (token1, token2) => {
  const signers = await ethers.getSigners();
  for (let i = 0; i < signers.length; i++) {
    const current_signer = signers[i];
    //connect current signer to contract
    const current_token1 = token1.connect(current_signer);
    const current_token2 = token2.connect(current_signer);
    //mint 100 of token1 and token2 to them
    await current_token1.mint(100);
    await current_token2.mint(100);
  } 
}

const randomSwapsAll = async(token1, token2, pool) => {
  const signers = await ethers.getSigners();
  for(let i=0; i<signers.length; i++) {
    const current_signer = signers[i];
    const token_choice = Math.random() > 0.5? token1: token2;
    const userBalance = await token_choice.balanceOf(current_signer.address);
    const amount = getRandomInt(1, userBalance);
    await token_choice.approve(pool, amount, {from: current_signer.address});
    await pool.swap(token_choice, amount, {from: current_signer.address});
    
  }
}

const runSwaps = async () => {
  const signers = await ethers.getSigners();
  const [owner] = await ethers.getSigners();
  //setup pool etc
  const swap1 = await SwapTokenFactory.deploy(0, 'SwapToken1', 'SWP1');
  const swap2 = await SwapTokenFactory.deploy(0, 'SwapToken2', 'SWP2');
  const lpToken = await LpTokenFactory.deploy(0, 'LpToken', 'LP');  
  const liquidityPool = await LiquidityPoolFactory.deploy(swap1, swap2, lpToken); 
  await lpToken.transferOwnership(liquidityPool);
  const initialAmount = 10000;
  await swap1.mint(initialAmount, {from: owner.address});
  await swap2.mint(initialAmount, {from: owner.address});
  
  await swap1.approve(liquidityPool, 10000, {from: owner.address});
  await swap2.approve(liquidityPool, 5000, {from: owner.address});
  await liquidityPool.addLiquidity(10000, 5000, 0, { from: owner.address});  

  await mintTokensAll(swap1, swap2);
  //await randomSwapsAll(swap1, swap2, liquidityPool);

}

const runSampleTrans = async () => {
  const [owner, second] = await ethers.getSigners();
  const swap1 = await SwapTokenFactory.deploy(0, 'SwapToken1', 'SWP1');
  const swap2 = await SwapTokenFactory.deploy(0, 'SwapToken2', 'SWP2');
  const lpToken = await LpTokenFactory.deploy(0, 'LpToken', 'LP');  
  const liquidityPool = await LiquidityPoolFactory.deploy(swap1, swap2, lpToken); 
  await lpToken.transferOwnership(liquidityPool);
  const initialAmount = 10000;
  await swap1.mint(initialAmount, {from: owner.address});
  await swap2.mint(initialAmount, {from: owner.address});
  
  await swap1.approve(liquidityPool, 10000, {from: owner.address});
  await swap2.approve(liquidityPool, 5000, {from: owner.address});
  await liquidityPool.addLiquidity(10000, 5000, 0, { from: owner.address});  

  const reserve1 = await liquidityPool.token1_reserve();
  const reserve2 = await liquidityPool.token2_reserve();
  console.log(Number(reserve1));
  console.log(Number(reserve2));
}

await runSwaps();