import {assert} from 'chai';
import pkg from 'hardhat';
const {ethers} = pkg;
import { offChainSwapCalc } from '../helpers.js';
const LpTokenFactory = await ethers.getContractFactory("LpToken");
const swapTokenFactory = await ethers.getContractFactory("SwapToken");
const liquidityPoolFactory = await ethers.getContractFactory("VariableLiquidityPool");



describe("Liquidity Pool tests", () => {
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

  it("should allow the user to deposit liquidity into the pool", async () => {
    //mint amount of token A and token B to accounts[0]
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
    const shares = await lptoken.balanceOf(owner);
    console.log(shares);
    assert.isAbove(shares, 0, "shares should be greater than 0");

  })
  it("should revert when attempting to deposit more than approved", async() => {
    const amountA = ethers.parseEther("11000");
    const amountB = ethers.parseEther("500");
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    await swap1.approve(liquiditypool, ethers.parseEther("1000"));
    await swap2.approve(liquiditypool, amountB);

    try{
      await liquiditypool.addLiquidity(amountA, amountB, 0);
      assert.fail('transaction should revert as not approved to spend this much')
    }catch(error){
      assert(error.message.includes('revert'), 'expected a revert error')
      }
  })

  it('should allow the user to withdraw liquidity from the pool after depositing it and the locking period has passed', async() => {
    const [owner] = await ethers.getSigners();
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("500");
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);

    await liquiditypool.addLiquidity(amountA, amountB, 0); 

    const shares = await lptoken.balanceOf(owner);
    console.log("Shares minted: ", shares.toString());

    //await time.increase(time.duration.seconds[31]);
    await liquiditypool.removeLiquidity(shares);
    const newABalance = await swap1.balanceOf(owner);
    const newBBalance = await swap2.balanceOf(owner);
    assert.equal(
      newABalance,
      amountA,
    );
    assert.equal(newBBalance, ethers.parseEther("500"));

  });
  it('should allow the user to swap an amount of token A for an amount of token B', async () => {
    const [owner, second] = await ethers.getSigners();  

    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("500");
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);
    
    const secondAmount = ethers.parseEther("150");
    //mint some tokens to another account
    const secondswap1 = await swap1.connect(second);
    const secondswap2 = await swap2.connect(second);
    const secondliquiditypool = await liquiditypool.connect(second);
    await secondswap1.mint(secondAmount);
    await secondswap1.approve(liquiditypool, secondAmount);
    await secondliquiditypool.swap(secondswap1, secondAmount);
    const newBBalance = await secondswap2.balanceOf(second);
    const newABalance = await secondswap1.balanceOf(second);
    console.log(newBBalance.toString());
    assert.isAbove(Number(newBBalance),0 , "new balance should be greater than 0");
    assert.equal(Number(newABalance), 0 , "new balance should be 0");
  })

  it('should perform an accurate swap with full precision', async () => {
    const [owner, second] = await ethers.getSigners();
    //setup the pool
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("500");
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);
    //calculate swap locally
    const amountAIn = ethers.parseEther("100");

    // uint countInWithFee = (countIn * 997) / 1000;
    // //dy = ydx / x + dx ss
    // amountOut =  (outReserve * countInWithFee) / (inReserve + countInWithFee );
    
    //start by checking fee calculation
    const contractFee = await liquiditypool.amountWithFee(amountAIn);
    const withFee = amountAIn * BigInt(997) / BigInt(1000);
    const intermediate = BigInt(amountB * withFee);
    const intermediate2 = BigInt(amountA + withFee);
    const final = intermediate / intermediate2;
    const onChainSwap  = await liquiditypool.calculateSwap(amountAIn, amountA, amountB);
    const offChainSwap = await offChainSwapCalc(amountAIn, 3, amountA, amountB)
    console.log('onchain-val ', onChainSwap);
    console.log('off-chain   ', offChainSwap);
    assert.equal(onChainSwap, offChainSwap);


    
  })

})