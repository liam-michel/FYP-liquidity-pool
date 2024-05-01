import { assert } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
import { onChainSwapCalc } from "../helpers.js";
const LpTokenFactory = await ethers.getContractFactory("LpToken");
const swapTokenFactory = await ethers.getContractFactory("SwapToken");
const liquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");

describe("Liquidity Pool tests", () => {
  let swap1, swap2, lptoken, liquiditypool;
  beforeEach(async () => {
    swap1 = await swapTokenFactory.deploy(0, "swap1", "SWP1");
    swap2 = await swapTokenFactory.deploy(0, "swap2", "SWP2");
    lptoken = await LpTokenFactory.deploy(0, "LpToken", "LPT");
    liquiditypool = await liquidityPoolFactory.deploy(swap1, swap2, lptoken);
    //transfer ownership of the lptoken to liquidity pool
    await lptoken.transferOwnership(liquiditypool);
    const amountA = ethers.parseEther("500");
    const amountB = ethers.parseEther("1000");
    console.log(typeof amountA);
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);
  });

  it("should allow the user to deposit liquidity into the pool", async () => {
    //mint amount of token A and token B to accounts[0]
    const [owner] = await ethers.getSigners();
    const shares = await lptoken.balanceOf(owner);
    console.log(shares);
    assert.isAbove(shares, 0, "shares should be greater than 0");
  });
  it("should revert when attempting to deposit more than approved", async () => {
    const amountA = ethers.parseEther("11000");
    const amountB = ethers.parseEther("500");
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    await swap1.approve(liquiditypool, ethers.parseEther("1000"));
    await swap2.approve(liquiditypool, amountB);

    try {
      await liquiditypool.addLiquidity(amountA, amountB, 0);
      assert.fail(
        "transaction should revert as not approved to spend this much"
      );
    } catch (error) {
      assert(error.message.includes("revert"), "expected a revert error");
    }
  });

  it("should allow the user to withdraw liquidity from the pool after depositing it and the locking period has passed", async () => {
    const [owner, second] = await ethers.getSigners();
    const amountA = ethers.parseEther("500");
    const amountB = ethers.parseEther("1000");
    const secondswap1 = await swap1.connect(second);
    const secondswap2 = await swap2.connect(second);
    const secondliquiditypool = await liquiditypool.connect(second);
    const secondlptoken = await lptoken.connect(second);
    await secondswap1.mint(amountA);
    await secondswap2.mint(amountB);
    await secondswap1.approve(secondliquiditypool, amountA);
    await secondswap2.approve(secondliquiditypool, amountB);

    await secondliquiditypool.addLiquidity(amountA, amountB, 0);

    const shares = await secondlptoken.balanceOf(owner);
    console.log("Shares minted: ", shares.toString());

    //await time.increase(time.duration.seconds[31]);
    await secondliquiditypool.removeLiquidity(shares);
    const newABalance = await secondswap1.balanceOf(second);
    const newBBalance = await secondswap2.balanceOf(second);
    console.log("balance of A: ", newABalance.toString());
    console.log("balance of B: ", newBBalance.toString());
    assert.equal(newABalance, ethers.parseEther("500"));
    assert.equal(newBBalance, ethers.parseEther("1000"));
  });

  it("should allow the user to swap an amount of token A for an amount of token B", async () => {
    const [owner, second] = await ethers.getSigners();

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
    assert.isAbove(
      Number(newBBalance),
      0,
      "new balance should be greater than 0"
    );
    assert.equal(Number(newABalance), 0, "new balance should be 0");
  });

  it("should perform an accurate swap with full precision", async () => {
    const [owner, second] = await ethers.getSigners();

    //calculate swap locally
    const amountAIn = ethers.parseEther("100");
    const amountA = await liquiditypool.token1_reserve();
    const amountB = await liquiditypool.token2_reserve();

    // uint countInWithFee = (countIn * 997) / 1000;
    // //dy = ydx / x + dx ss
    // amountOut =  (outReserve * countInWithFee) / (inReserve + countInWithFee );

    //start by checking fee calculation

    const onChainSwap = await liquiditypool.calculateSwap(
      amountAIn,
      amountA,
      amountB
    );
    console.log("done chain swap");
    const mockOnChainSwap = await onChainSwapCalc(
      amountAIn,
      3,
      amountA,
      amountB
    );
    console.log("done off chain swap");
    console.log("onchain-val ", onChainSwap);
    console.log("off-chain   ", mockOnChainSwap);
    assert.equal(onChainSwap, mockOnChainSwap);
  });
  it("should charge for swap as other reserve depleted", async () => {
    const [owner, second] = await ethers.getSigners();
    // //add more liquidity to the pool
    const amountA = ethers.parseEther("100000");
    const amountB = ethers.parseEther("300000");
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, ethers.parseEther("200000"));
    await liquiditypool.addLiquidity(amountA, ethers.parseEther("200000"), 0);

    const newswap1 = await swap1.connect(second);
    const newswap2 = await swap2.connect(second);
    const newliquiditypool = await liquiditypool.connect(second);

    const inAmount = ethers.parseEther("500000");
    await newswap2.mint(ethers.parseEther("500000"));
    await newswap2.approve(newliquiditypool, ethers.parseEther("500000"));

    // //fetch both reserves
    const reserveA = await liquiditypool.token1_reserve();
    const reserveB = await liquiditypool.token2_reserve();
    console.log("reserve A: ", reserveA);
    console.log("reserve B: ", reserveB);
    const product = reserveA * reserveB;
    console.log("constant product: ", product.toString());
    // //swap B for A multiple times
    // for (let i = 0; i < 50; i++) {
    //   await newliquiditypool.swap(newswap2, ethers.parseEther("10000"));
    // }
    await newliquiditypool.swap(newswap2, ethers.parseEther("500000"));
    const newReserve1 = await liquiditypool.token1_reserve();
    const newReserve2 = await liquiditypool.token2_reserve();
    console.log("new reserve A: ", newReserve1);
    console.log("new reserve B: ", newReserve2);
    const newProduct = newReserve1 * newReserve2;
    console.log("new constant product: ", newProduct.toString());
  });
  it("should allow the user to swap an amount of token A for an amount of token B", async () => {
    const [owner, second] = await ethers.getSigners();

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
    assert.isAbove(
      Number(newBBalance),
      0,
      "new balance should be greater than 0"
    );
    assert.equal(Number(newABalance), 0, "new balance should be 0");
  });
});
