import pkg from 'hardhat';
import {assert} from 'chai';
const {ethers} = pkg;
const {parseEther} = ethers;

const LpTokenFactory = await ethers.getContractFactory("LpToken");
const swapTokenFactory = await ethers.getContractFactory("SwapToken");
const liquidityPoolFactory = await ethers.getContractFactory("DynamicLiquidityPool");


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
  });

  it('should allow me to view and set the external ratio (for testing)', async() => {
    const [owner] = await ethers.getSigners();  

    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("500");
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);

    //fetch external ratio
    const externalRatio = await liquiditypool.getChainlinkDataFeedLatestAnswer();
    console.log(externalRatio);

    //set external ratio
    await liquiditypool.setExternalRatio(100);
    const newExternalRatio = await liquiditypool.getChainlinkDataFeedLatestAnswer();
    console.log(newExternalRatio);
    assert.equal(externalRatio, 0);
    assert.equal(newExternalRatio, 100);
  })

  it('should try to fetch a new external ratio after every 5 swaps that go through', async() => {
    const [owner] = await ethers.getSigners();  

    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("500");
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);

    const amountIn = ethers.parseEther("100");
    await swap1.mint(amountIn);
    await swap1.approve(liquiditypool, amountIn);
    
    for(let i = 0; i < 4; i++){
      await liquiditypool.swap(swap1, parseEther("10"));
    }
    const recentSwaps = await liquiditypool.recent_swaps();
    console.log("Rccent swaps: ", recentSwaps);
  //   //do another swap
    await liquiditypool.swap(swap1, parseEther("10"));
    const newRecentSwaps = await liquiditypool.recent_swaps();
    console.log("Recent swaps: ", newRecentSwaps);

    assert.equal(recentSwaps, 4);
    assert.equal(newRecentSwaps, 1);
  })
})