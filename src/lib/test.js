import BigNumber from "bignumber.js";
import Web3 from "web3";
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
  //console.log(amountOut.toString());
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
  //console.log(amountOut.toString());
  return amountOut.toString();
};

const x = calculateSwapAforB(1);

const minimumGood = new BigNumber(x)
  .times(100 - 5.62)
  .div(100)
  .decimalPlaces(18, BigNumber.ROUND_DOWN);

const minimumbad = new BigNumber(x).times(100 - 5).div(100);
//console.log(minimumGood);

console.log(minimumbad);
console.log(minimumGood);

const unround = 5.657;
const rounded = Math.floor(unround * 100) / 100;
console.log(rounded);
