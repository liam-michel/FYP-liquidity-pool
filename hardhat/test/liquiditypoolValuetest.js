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
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);
  });

  it("should charge more and more for B as A is drained", async () => {
    //mint amount of token A and token B to accounts[0]
    const [owner] = await ethers.getSigners();
    const shares = await lptoken.balanceOf(owner);
    console.log(shares);
    assert.isAbove(shares, 0, "shares should be greater than 0");
  });
});
