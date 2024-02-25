import BigNumber from "bignumber.js";

const res1 = new BigNumber(1000).times(1e18);
const res2 = new BigNumber(500).times(1e18);

//dy = ydx / x + dx

const swapXforY = (amountIn) => {
  const withFees = new BigNumber(amountIn).times(1e18).times(0.997);
  console.log("Adjusted amount in: ", withFees.toString());
  const amountOut = res2
    .times(withFees)
    .div(res1.plus(withFees))
    .integerValue(BigNumber.ROUND_DOWN);
  console.log(amountOut);
};

const swapYforX = (amountIn) => {
  const withFees = new BigNumber(amountIn).times(1e18).times(0.997);
  console.log("Adjusted amount in: ", withFees.toString());
  const amountOut = res1
    .times(withFees)
    .div(res2.plus(withFees))
    .integerValue(BigNumber.ROUND_DOWN);
  console.log(amountOut);
};

swapXforY(100);
