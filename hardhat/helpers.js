export const onChainSwapCalc = async (amountIn, fee, inReserve, outReserve) => {
  const withFee = (amountIn * BigInt(1000 - fee)) / BigInt(1000);
  const intermediate = BigInt(outReserve * withFee);
  const intermediate2 = BigInt(inReserve + withFee);
  const final = intermediate / intermediate2;
  return final;
};

// ETH / USD = 1000 i.e. amount of USD per ETH
//A/ B should be how much B per A

//ratio of 1.25 means 1.25 B per A
// or 0.8A per B
//buying A externally means do amountIn / ratio as 1.25B should be 1A

import fs from "fs";

export function writeToFile(filename, values) {
  const data = values.join("\n");

  fs.writeFile(filename, data, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log("Values written to file successfully!");
    }
  });
}

export const externalBuyA = (amountIn, ratio) => {
  const scale = BigInt(1e18);
  const scaledIn = BigInt(amountIn) * scale;
  const scaledRatio = BigInt(ratio * 1e18);
  const amountOut = BigInt(scaledIn) / scaledRatio;
  return amountOut;
};

//selling A for B means we Need to do amountIn * ratio as 1A should be 1.25B
export const externalSellA = (amountIn, ratio) => {
  const scale = BigInt(1e18);
  //ratio is a float so need to scale it
  const scaledRatio = BigInt(Math.floor(1e18 * ratio));

  return (BigInt(amountIn) * scaledRatio) / scale;
};

export const arbitrage_calculation = async (
  external_ratio,
  pool,
  tokenIn,
  amountIn
) => {
  amountIn = BigInt(amountIn);
  console.log("Token In: ", tokenIn);
  const reserve1 = await pool.token1_reserve();
  const reserve2 = await pool.token2_reserve();
  const internal_ratio = Number(reserve2) / Number(reserve1); // Floor division
  console.log("Internal ratio: ", internal_ratio);
  console.log("External ratio: ", external_ratio);

  // Internal market has a higher price for Token A: Buy A for B, sell it to the pool
  if (internal_ratio > external_ratio && tokenIn == "B") {
    console.log(
      "Token A is more expensive inside, buying A external and selling it to the pool "
    );
    //buy token A for B
    const initial_purchase = externalBuyA(amountIn, external_ratio);

    console.log(
      `Bought ${initial_purchase} token A externally for ${amountIn} token B`
    );
    const calculated_out = await onChainSwapCalc(
      initial_purchase,
      3,
      reserve1,
      reserve2
    );
    console.log("Token B received from smart contract: ", calculated_out);
    const profit = calculated_out - amountIn;
    console.log(`Total profit of ${profit} token B`);
    return profit;
  }
  //internal market has lower price for token A, so buy token A from pool and sell externally
  if (internal_ratio < external_ratio && tokenIn == "B") {
    console.log(
      "Token A is cheaper inside, buy token A from pool and sell externally"
    );
    const amountOut_A = await onChainSwapCalc(amountIn, 3, reserve2, reserve1);
    console.log(
      `Bought ${Number(amountOut_A)} token A from pool for ${amountIn} token B`
    );
    //sell it to external market
    const output_price = externalSellA(amountOut_A, external_ratio);
    console.log("Sold token A externally for ", output_price);
    const profit = output_price - amountIn;
    console.log(`Total profit of ${profit} token B`);
    const newInternalReserve1 = await pool.token1_reserve();
    const newInternalReserve2 = await pool.token2_reserve();
    const newInternalRatio =
      Number(newInternalReserve2) / Number(newInternalReserve1);
    console.log("New internal ratio: ", newInternalRatio);
    return profit;
  }

  //internal market has higher price for A, so lower price for B. Buy B internally and sell it to external market
  if (internal_ratio > external_ratio && tokenIn == "A") {
    console.log(
      "Token B is cheaper inside, buy token B from pool and sell externally"
    );
    //buy token B from the pool, so reserve1 = A, reserve2 = B
    const amountOut_B = await onChainSwapCalc(amountIn, 3, reserve1, reserve2);
    console.log(
      `Bought ${Number(amountOut_B)} token B from pool for ${amountIn} token A`
    );
    //sell it to external market (Buy A for B)
    const output_price = externalBuyA(amountOut_B, external_ratio);
    console.log(
      `Sold ${amountOut_B} token B externally for ${output_price} token A`
    );
    const profit = output_price - amountIn;
    console.log("Total profit of ", profit);
    return profit;
  }

  //internal market has lower price for A, so higher price for B. Buy B externally and sell it to the pool
  if (internal_ratio < external_ratio && tokenIn == "A") {
    console.log(
      "Token B is more expensive inside, buy token B externally and sell it to the pool"
    );
    const amountOut_B = externalSellA(amountIn, external_ratio);
    console.log("Bought ", amountOut_B, " token B externally for ", amountIn);
    const output_price = await onChainSwapCalc(
      amountOut_B,
      3,
      reserve2,
      reserve1
    );

    console.log(
      `Sold ${amountOut_B} token B to pool for ${output_price} token A`
    );
    console.log(typeof output_price);
    console.log(typeof amountIn);
    const profit = output_price - amountIn;
    console.log(`Total profit of ${profit} token A`);
    return profit;
  } else {
    console.error("No arbitrage opportunity here");
  }
};
