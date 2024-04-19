import {assert} from 'chai';

const LpTokenFactory = await ethers.getContractFactory("LpToken");
const swapTokenFactory = await ethers.getContractFactory("SwapToken");
const liquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");

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

    await swap1.mint(1000);
    await swap2.mint(500);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, 1000);
    await swap2.approve(liquiditypool, 500);
    await liquiditypool.addLiquidity(1000, 500, 0);
    const shares = await lptoken.balanceOf(owner);
    assert.isAbove(Number(shares), 0, "shares should be greater than 0");

  })
  it("should revert when attempting to deposit more than approved", async() => {
    await swap1.mint(11000);
    await swap2.mint(500);
    await swap1.approve(liquiditypool, 1000);
    await swap2.approve(liquiditypool, 500);

    try{
      await liquiditypool.addLiquidity(1100, 500, 0);
      assert.fail('transaction should revert as not approved to spend this much')
    }catch(error){
      assert(error.message.includes('revert'), 'expected a revert error')
      }
  })

it('should allow the user to withdraw liquidity from the pool after depositing it and the locking period has passed', async() => {
  const [owner] = await ethers.getSigners();
  await swap1.mint(1000);
  await swap2.mint(500);
  await swap1.approve(liquiditypool, 1000);
  await swap2.approve(liquiditypool, 500);

  await liquiditypool.addLiquidity(1000, 500, 0); 

  const shares = await lptoken.balanceOf(owner);
  console.log("Shares minted: ", shares.toString());

  //await time.increase(time.duration.seconds[31]);
  await liquiditypool.removeLiquidity(shares);
  const newABalance = await swap1.balanceOf(owner);
  const newBBalance = await swap2.balanceOf(owner);
  assert.equal(
    newABalance,
    1000,
  );
  assert.equal(newBBalance, 500);



  
})
})