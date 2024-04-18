const Swap = artifacts.require("SwapToken");
const LpToken = artifacts.require("LpToken");
const LiquidityPool = artifacts.require("LiquidityPool");
const { time } = require("@openzeppelin/test-helpers");

contract("Liquidity Pool tests", (accounts) => {
  let swap1, swap2, lptoken, liquiditypool;
  beforeEach(async () => {
    swap1 = await Swap.new(0, "swap1", "SWP1");
    swap2 = await Swap.new(0, "swap2", "SWP2");
    lptoken = await LpToken.new(0, "LpToken", "LPT");
    liquiditypool = await LiquidityPool.new(
      swap1.address,
      swap2.address,
      lptoken.address
    );
    //transfer ownership of the lptoken to liquidity pool
    await lptoken.transferOwnership(liquiditypool.address);
  });
  it("should allow the user to deposit liquidity into the pool", async () => {
    //mint amount of token A and token B to accounts[0]
    await swap1.mint(1000);
    await swap2.mint(500);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool.address, 1000);
    await swap2.approve(liquiditypool.address, 500);

    const shares = await liquiditypool.addLiquidity(1000, 50, 0, {
      from: accounts[0],
    });
    console.log("shares:", shares.toString());
  });
  it("should revert when attempting to deposit more than approved", async () => {
    // mint amount of token A and token B to accounts[0]
    await swap1.mint(11000);
    await swap2.mint(500);
    // approve on swapTokens for liquidity pool to spend
    await swap1.approve(liquiditypool.address, 1000);
    await swap2.approve(liquiditypool.address, 500);

    // Try to deposit more than approved
    try {
      await liquiditypool.addLiquidity(1100, 500, 0);
      assert.fail(
        "transaction should revert as not approved to spend this much"
      );
    } catch (error) {
      assert(error.message.includes("revert"), "expected a revert error");
    }
  });
  it("should allow the user to withdraw liquidity from the pool after depositing it and waiting 30 seconds", async () => {
    await swap1.mint(1000);
    await swap2.mint(500);
    // approve on swapTokens for liquidity pool to spend
    await swap1.approve(liquiditypool.address, 1000);
    await swap2.approve(liquiditypool.address, 500);

    // Deposit liquidity
    await liquiditypool.addLiquidity(1000, 50, 0);

    // Withdraw liquidity
    const shares = await lptoken.balanceOf(accounts[0]);
    console.log("Shares minted ", shares.toString());
    await time.increase(time.duration.minutes(1));
    await liquiditypool.removeLiquidity(shares);
    const newABalance = await swap1.balanceOf(accounts[0]);
    const newBalance = await swap2.balanceOf(accounts[0]);
    assert.equal(
      newABalance.toString(),
      "1000",
      "The balance was not set correctly"
    );
    assert.equal(
      newBalance.toString(),
      "500",
      "The balance was not set correctly"
    );
  });
  it("should revert when attempting to withdraw liquidity before the locking period ends", async () => {
    try {
      await swap1.mint(1000);
      await swap2.mint(500);
      // approve on swapTokens for liquidity pool to spend
      await swap1.approve(liquiditypool.address, 1000);
      await swap2.approve(liquiditypool.address, 500);

      // Deposit liquidity
      await liquiditypool.addLiquidity(1000, 50, 0);
      // Withdraw liquidity
      const shares = await lptoken.balanceOf(accounts[0]);
      console.log("Shares minted ", shares.toString());
      await time.increase(time.duration.minutes(1));
      await liquiditypool.removeLiquidity(shares);
      assert.fail(
        "transaction should revert as the locking period has not ended"
      );
    } catch (error) {
      assert(error.message.includes("revert"), "expected a revert error");
    }
  });
  it("should allow the user to swap an amount of token A for an amount of token B", async () => {
    await swap1.mint(1000);
    await swap2.mint(500);
    // approve on swapTokens for liquidity pool to spend
    await swap1.approve(liquiditypool.address, 1000);
    await swap2.approve(liquiditypool.address, 500);

    // Deposit liquidity
    await liquiditypool.addLiquidity(1000, 50, 0);

    // Swap token A for token B
    await liquiditypool.swap(swap1.address, 100);
    const newABalance = await swap1.balanceOf(accounts[0]);
    const newBBalance = await swap2.balanceOf(accounts[0]);
    assert.equal(
      newABalance.toString(),
      "900",
      "The balance was not set correctly"
    );
    assert.equal(
      newBBalance.toString(),
      "550",
      "The balance was not set correctly"
    );
  });
});
