import BigNumber from "bignumber.js";

const reserve1 = BigNumber(50).times(1e18);
const reserve2 = BigNumber(25).times(1e18);

const calculateSwapAforB = (amountIn) => {
  const res1 = new BigNumber(reserve1);
  const res2 = new BigNumber(reserve2);
  const withFees = new BigNumber(amountIn).times(1e18).times(0.997);
  const amountOut = res2
    .times(withFees)
    .div(res1.plus(withFees))
    .integerValue(BigNumber.ROUND_DOWN)
    .div(1e18);
  console.log(amountOut.toString());
  return amountOut.toString();
};

const calculateSwapBforA = (amountIn) => {
  const res1 = new BigNumber(reserve1);
  const res2 = new BigNumber(reserve2);
  const withFees = new BigNumber(amountIn).times(1e18).times(0.997);
  const amountOut = res1
    .times(withFees)
    .div(res2.plus(withFees))
    .integerValue(BigNumber.ROUND_DOWN)
    .div(1e18);
  console.log(amountOut.toString());
  return amountOut.toString();
};

console.log(calculateSwapAforB(1));
console.log(calculateSwapAforB(1) * 1e18);
