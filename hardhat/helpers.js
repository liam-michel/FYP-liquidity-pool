export const onChainSwapCalc = async(amountIn, fee, inReserve, outReserve) =>{
  const withFee = amountIn * BigInt(1000-fee) / BigInt(1000);
  const intermediate = BigInt(outReserve * withFee);
  const intermediate2 = BigInt(inReserve + withFee);
  const final = intermediate / intermediate2;
  return final;
}

// ETH / USD = 1000 i.e. amount of USD per ETH
//A/ B should be how much B per A 

//ratio of 1.25 means 1.25 B per A
//buying A externally means do amountIn / ratio as 1.25B should be 1A
export const externalBuyA = (amountIn, ratio ) => {
  const scale = BigInt(1e18);
  const scaledIn = BigInt(amountIn) * scale;
  const scaledRatio = BigInt(ratio * 1e18);
  const amountOut = (BigInt(scaledIn) / scaledRatio);
  console.log("Amount out is ", amountOut)
  return amountOut;


}

//selling A for B means we Need to do amountIn * ratio as 1A should be 1.25B
export const externalSellA = (amountIn, ratio) => {
  const scale = BigInt(1e18);
  //ratio is a float so need to scale it
  const scaledRatio = BigInt(Math.floor(1e18 * ratio));

  return BigInt(amountIn) * scaledRatio / scale;
}
