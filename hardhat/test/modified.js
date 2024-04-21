import pkg from 'hardhat';
const {ethers} = pkg;

const LpTokenFactory = await ethers.getContractFactory("LpToken");
const swapTokenFactory = await ethers.getContractFactory("SwapToken");
const liquidityPoolFactory = await ethers.getContractFactory("VariableLiquidityPool");


describe('Modified', () => {
  let swap1, swap2, lptoken, liquiditypool;
  beforeEach(async () => {
    swap1 = await swapTokenFactory.deploy(0, "swap1", "SWP1");
    swap2 = await swapTokenFactory.deploy(0, "swap2", "SWP2");
    lptoken = await LpTokenFactory.deploy(0, "LpToken", "LPT");
    liquiditypool = await liquidityPoolFactory.deploy(
      swap1,
      swap2,
      lptoken
    );
    
    //transfer ownership of the lptoken to liquidity pool
    await lptoken.transferOwnership(liquiditypool);
  })
  it('should return the reserve ratio', async () => {
    const [owner] = await ethers.getSigners();  

    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("500");
    console.log(typeof(amountA));
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);

    //fetch reserve ratio
    const reserveRatio = await liquiditypool.getReserveRatio();
    console.log(reserveRatio);
  })
})