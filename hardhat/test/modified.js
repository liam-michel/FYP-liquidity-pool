import pkg from "hardhat";
import { assert } from "chai";
const { ethers } = pkg;
const { parseEther } = ethers;

const LpTokenFactory = await ethers.getContractFactory("LpToken");
const swapTokenFactory = await ethers.getContractFactory("SwapToken");
const liquidityPoolFactory = await ethers.getContractFactory(
  "DynamicLiquidityPool"
);

describe("Modified", () => {
  let swap1, swap2, lptoken, liquiditypool;
  beforeEach(async () => {
    swap1 = await swapTokenFactory.deploy(0, "swap1", "SWP1");
    swap2 = await swapTokenFactory.deploy(0, "swap2", "SWP2");
    lptoken = await LpTokenFactory.deploy(0, "LpToken", "LPT");
    liquiditypool = await liquidityPoolFactory.deploy(swap1, swap2, lptoken);

    //transfer ownership of the lptoken to liquidity pool
    await lptoken.transferOwnership(liquiditypool);
    const [owner] = await ethers.getSigners();

    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("500");
    console.log(typeof amountA);
    await swap1.mint(amountA);
    await swap2.mint(amountB);
    //approve on swapTokens for liquidty pool to spend
    await swap1.approve(liquiditypool, amountA);
    await swap2.approve(liquiditypool, amountB);
    await liquiditypool.addLiquidity(amountA, amountB, 0);
  });
  it("should return the reserve ratio", async () => {
    //fetch reserve ratio
    const reserveRatio = await liquiditypool.getReserveRatio();
    console.log(reserveRatio);
  });

  it("should allow me to view and set the external ratio (for testing)", async () => {
    const [owner] = await ethers.getSigners();

    //fetch external ratio
    const externalRatio =
      await liquiditypool.getChainlinkDataFeedLatestAnswer();
    console.log(externalRatio);

    //set external ratio
    await liquiditypool.setExternalRatio(100);
    const newExternalRatio =
      await liquiditypool.getChainlinkDataFeedLatestAnswer();
    console.log(newExternalRatio);
    assert.equal(externalRatio, 0);
    assert.equal(newExternalRatio, 100);
  });

  it("should try to fetch a new external ratio after every 5 swaps that go through", async () => {
    const [owner] = await ethers.getSigners();

    const amountIn = ethers.parseEther("100");
    await swap1.mint(amountIn);
    await swap1.approve(liquiditypool, amountIn);

    for (let i = 0; i < 4; i++) {
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
  });

  it("should gather data points every 5 swaps", async () => {
    const [owner] = await ethers.getSigners();

    //give user some liquidity to do swaps with
    const amountIn = ethers.parseEther("100");
    await swap1.mint(amountIn);
    await swap1.approve(liquiditypool, amountIn);

    const initialAverageRatio = await liquiditypool.average_external_ratio();
    const lastFetchedRatio = await liquiditypool.lastFetchedExternalRatio();
    assert.equal(initialAverageRatio, 0n);
    assert.equal(lastFetchedRatio, 0n);
    console.log(initialAverageRatio);
    console.log(lastFetchedRatio);

    //set the fetch ratio from here (for testing)
    await liquiditypool.setExternalRatio(parseEther("1.2"));
    //run 5 swaps
    for (let i = 0; i < 5; i++) {
      await liquiditypool.swap(swap1, parseEther("5"));
      const recentSwaps = await liquiditypool.recent_swaps();
    }

    //check for fetched value again
    const newFetchedRatio = await liquiditypool.lastFetchedExternalRatio();
    const newAverageRatio = await liquiditypool.average_external_ratio();

    assert.equal(newFetchedRatio, parseEther("1.2"));
    assert.equal(newAverageRatio, parseEther("1.2"));
    const dataPoints = await liquiditypool.getDataPoints();

    //run another 5 swaps
    //change external ratio again
    await liquiditypool.setExternalRatio(parseEther("1.3"));
    for (let i = 0; i < 5; i++) {
      await liquiditypool.swap(swap1, parseEther("5"));
      const recentSwaps = await liquiditypool.recent_swaps();
    }
    const secondFetchedRatio = await liquiditypool.lastFetchedExternalRatio();
    const secondAverageRatio = await liquiditypool.average_external_ratio();
    const newDataPoints = await liquiditypool.getDataPoints();

    assert.equal(secondAverageRatio, parseEther("1.25"));
    assert.equal(secondFetchedRatio, parseEther("1.3"));
    assert.equal(newDataPoints[0], parseEther("1.2"));
    assert.equal(newDataPoints[1], parseEther("1.3"));
  });

  it("should only store 5 data points and pop from the beginning", async () => {
    const [owner] = await ethers.getSigners();

    //give user some liquidity to do swaps with
    const amountIn = ethers.parseEther("200");
    await swap1.mint(amountIn);
    await swap1.approve(liquiditypool, amountIn);
    //set external fetch ratio
    await liquiditypool.setExternalRatio(parseEther("1.2"));
    const ratios = [
      parseEther("1.2"),
      parseEther("1.25"),
      parseEther("1.22"),
      parseEther("1.21"),
      parseEther("1.24"),
      parseEther("1.23"),
    ];
    // run 25 swaps, each 5 swaps set an external ratio from the ratios list
    for (let i = 0; i < 25; i++) {
      if ((i + 1) % 5 == 0 && i != 0) {
        console.log("Iteration: ", i);
        const index = Math.floor(i / 5); // Use integer division to get the index

        const current_ratio = ratios[index]; // Use the corrected index to access the array
        await liquiditypool.setExternalRatio(current_ratio);
      }
      await liquiditypool.swap(swap1, parseEther("5"));
    }

    const oldDataPoints = await liquiditypool.getDataPoints();
    assert.equal(oldDataPoints.length, 5);
    assert.equal(oldDataPoints[0], parseEther("1.20"));
    //do 5 more swaps

    await liquiditypool.setExternalRatio(parseEther("1.23"));
    for (let i = 0; i < 5; i++) {
      await liquiditypool.swap(swap1, parseEther("5"));
    }

    //check dataPoints now
    const newDataPoints = await liquiditypool.getDataPoints();
    console.log(newDataPoints);
    assert.equal(newDataPoints.length, 5);
    assert.equal(newDataPoints[0], parseEther("1.25"));
    assert.equal(newDataPoints[4], parseEther("1.23"));
    const finalAverageRatio = await liquiditypool.average_external_ratio();
    console.log(finalAverageRatio);
  });
  it("should fetch new external ratio after time elapsed", async () => {
    const [owner] = await ethers.getSigners();

    //give user some liquidity to do swaps with
    const amountIn = ethers.parseEther("200");
    await swap1.mint(amountIn);
    await swap1.approve(liquiditypool, amountIn);

    const initialDataPoints = await liquiditypool.getDataPoints();
    assert.equal(initialDataPoints.length, 0);
    //simulate the passage of 61 seconds
    await ethers.provider.send("evm_increaseTime", [61]);
    //run a swap
    await liquiditypool.swap(swap1, parseEther("5"));
    //now re-check datapoints
    const newDataPoints = await liquiditypool.getDataPoints();
    assert.equal(newDataPoints.length, 1);
  });

  it("should use the base fee for transactions when reserve ratios are close", async () => {
    const [owner] = await ethers.getSigners();

    //give user some liquidity to do swaps with
    const amountIn = ethers.parseEther("200");
    await swap1.mint(amountIn);
    await swap1.approve(liquiditypool, amountIn);

    //set exteranl ratio to 2.0
    await liquiditypool.setExternalRatio(parseEther("2.0"));
    //run 5 swaps
    for (let i = 0; i < 5; i++) {
      await liquiditypool.swap(swap1, 100);
    }
    //check external ratio
    const externalRatio = await liquiditypool.average_external_ratio();
    //check the internal fee based on this
    const internalFee = await liquiditypool.baseFee();
    console.log("external ratio: ", externalRatio);
    console.log("internal fee: ", internalFee);
    const internalRatio = await liquiditypool.getReserveRatio();
    console.log("intenal ratio: ", internalRatio);
    console.log("external ratio: ", externalRatio);
    assert.equal(internalFee, BigInt(3 * 10e15));
    assert.equal(externalRatio, parseEther("2.0"));
  });

  it("should use the modified fee when reserve ratios are not close", async () => {
    const [owner] = await ethers.getSigners();

    //give user some liquidity to do swaps with
    const amountIn = ethers.parseEther("20000");
    await swap1.mint(amountIn);
    await swap1.approve(liquiditypool, amountIn);

    //set exteranl ratio to 2.0
    await liquiditypool.setExternalRatio(parseEther("2.0"));
    //run 5 swaps
    for (let i = 0; i < 5; i++) {
      await liquiditypool.swap(swap1, parseEther("4000"));
    }
    //check external ratio
    const externalRatio = await liquiditypool.average_external_ratio();
    const internalRatio = await liquiditypool.getReserveRatio();
    console.log(externalRatio);
    console.log(internalRatio);
    //check the internal fee based on this
    const internalFee = await liquiditypool.baseFee();
    assert.equal(internalFee, BigInt(10e16));
    assert.equal(externalRatio, parseEther("2.0"));
    console.log("intenal ratio: ", internalRatio);
    console.log("external ratio: ", externalRatio);
  });
});
