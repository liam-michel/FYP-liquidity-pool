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
  });

  //test the precision of the alg
  it("should ensure that no money is lost to the ether (small reserve size)", async () => {
    const amountA = 50;
    const amountB = 100;
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);
    console.log("Initial A reserves", await liquiditypool.token1_reserve());
    console.log("Initial B reserves", await liquiditypool.token2_reserve());
    console.log("initial constant product of 5,000");
    const [owner, second] = await ethers.getSigners();
    const amountIn = 100;
    const reserve1 = await liquiditypool.token1_reserve();
    const reserve2 = await liquiditypool.token2_reserve();
    const oldTokensInside = reserve1 + reserve2;
    const oldTokensAll = reserve1 + reserve2 + BigInt(amountIn);

    const secondswap1 = swap1.connect(second);
    const secondswap2 = swap2.connect(second);
    const secondPool = liquiditypool.connect(second);
    await secondswap1.mint(amountIn);
    await secondswap1.approve(secondPool, amountIn);
    await secondPool.swap(secondswap1, amountIn);

    const reserve1After = await liquiditypool.token1_reserve();
    const reserve2After = await liquiditypool.token2_reserve();
    console.log("reserve1 after", reserve1After);
    console.log("reserve2 after", reserve2After);

    const newABalance = await swap2.balanceOf(second);
    console.log(
      "User received: ",
      newABalance.toString(),
      " token B for ",
      amountIn,
      " token A"
    );

    const newTokensInside = reserve1After + reserve2After;

    const newTokensAll = reserve1After + reserve2After + newABalance;

    console.log("old tokens inside: ", oldTokensInside.toString());
    console.log("new tokens inside: ", newTokensInside.toString());
    console.log("old tokens all: ", oldTokensAll.toString());
    console.log("new tokens all: ", newTokensAll.toString());
    assert.equal(oldTokensAll, newTokensAll);
  });
  it("should ensure that no money is lost to the ether (medium reserve size)", async () => {
    const amountA = 50000;
    const amountB = 100000;
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);
    console.log("Initial A reserves", await liquiditypool.token1_reserve());
    console.log("Initial B reserves", await liquiditypool.token2_reserve());
    console.log("initial constant product of: ", amountA * amountB);
    const [owner, second] = await ethers.getSigners();
    const amountIn = 950;
    const reserve1 = await liquiditypool.token1_reserve();
    const reserve2 = await liquiditypool.token2_reserve();
    const oldTokensInside = reserve1 + reserve2;
    const oldTokensAll = reserve1 + reserve2 + BigInt(amountIn);

    const secondswap1 = swap1.connect(second);
    const secondswap2 = swap2.connect(second);
    const secondPool = liquiditypool.connect(second);
    await secondswap1.mint(amountIn);
    await secondswap1.approve(secondPool, amountIn);
    await secondPool.swap(secondswap1, amountIn);

    const reserve1After = await liquiditypool.token1_reserve();
    const reserve2After = await liquiditypool.token2_reserve();
    console.log("reserve1 after", reserve1After);
    console.log("reserve2 after", reserve2After);

    const newABalance = await swap2.balanceOf(second);
    console.log(
      "User received: ",
      newABalance.toString(),
      " token B for ",
      amountIn,
      " token A"
    );

    const newTokensInside = reserve1After + reserve2After;

    const newTokensAll = reserve1After + reserve2After + newABalance;

    console.log("old tokens inside: ", oldTokensInside.toString());
    console.log("new tokens inside: ", newTokensInside.toString());
    console.log("old tokens all: ", oldTokensAll.toString());
    console.log("new tokens all: ", newTokensAll.toString());
    assert.equal(oldTokensAll, newTokensAll);
  });
  it("should ensure that no money is lost to the ether (medium reserve size)", async () => {
    const amountA = ethers.parseEther("5");
    const amountB = ethers.parseEther("10");
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);
    console.log("Initial A reserves", await liquiditypool.token1_reserve());
    console.log("Initial B reserves", await liquiditypool.token2_reserve());
    console.log("initial constant product of: ", amountA * amountB);
    const [owner, second] = await ethers.getSigners();
    const amountIn = ethers.parseEther("2");
    const reserve1 = await liquiditypool.token1_reserve();
    const reserve2 = await liquiditypool.token2_reserve();
    const oldTokensInside = reserve1 + reserve2;
    const oldTokensAll = reserve1 + reserve2 + BigInt(amountIn);

    const secondswap1 = swap1.connect(second);
    const secondswap2 = swap2.connect(second);
    const secondPool = liquiditypool.connect(second);
    await secondswap1.mint(amountIn);
    await secondswap1.approve(secondPool, amountIn);
    await secondPool.swap(secondswap1, amountIn);

    const reserve1After = await liquiditypool.token1_reserve();
    const reserve2After = await liquiditypool.token2_reserve();
    console.log("reserve1 after", reserve1After);
    console.log("reserve2 after", reserve2After);

    const newABalance = await swap2.balanceOf(second);
    console.log(
      "User received: ",
      newABalance.toString(),
      " token B for ",
      amountIn,
      " token A"
    );

    const newTokensInside = reserve1After + reserve2After;

    const newTokensAll = reserve1After + reserve2After + newABalance;

    console.log("old tokens inside: ", oldTokensInside);
    console.log("new tokens inside: ", newTokensInside);
    console.log("old tokens all: ", oldTokensAll);
    console.log("new tokens all: ", newTokensAll);
    assert.equal(oldTokensAll, newTokensAll);
  });
  it("should perform equivalent alternating swaps", async () => {
    const amountA = ethers.parseEther("50");
    const amountB = ethers.parseEther("100");
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);
    console.log("Initial A reserves", await liquiditypool.token1_reserve());
    console.log("Initial B reserves", await liquiditypool.token2_reserve());
    console.log("initial constant product of: ", amountA * amountB);
    const [owner, second] = await ethers.getSigners();
    //mint 50 of each token to second
    const amountIn = ethers.parseEther("50");
    const secondswap1 = swap1.connect(second);
    const secondswap2 = swap2.connect(second);
    const secondPool = liquiditypool.connect(second);
    await secondswap1.mint(amountIn);
    await secondswap2.mint(amountIn);
  });
});
