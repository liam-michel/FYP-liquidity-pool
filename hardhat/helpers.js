export const offChainSwapCalc = async(amountIn, fee, inReserve, outReserve) =>{
  const withFee = amountIn * BigInt(1000-fee) / BigInt(1000);
  const intermediate = BigInt(outReserve * withFee);
  const intermediate2 = BigInt(inReserve + withFee);
  const final = intermediate / intermediate2;
  return final;
}

