"use server";
import {
  rpc,
  LiquidityPoolABI,
  LPAddress,
  t1Address,
  t2Address,
} from "./constants.js";
import Web3 from "web3";
import BigNumber from "bignumber.js";

const web3 = new Web3(rpc);

export async function readReserves() {
  const contract = new web3.eth.Contract(LiquidityPoolABI, LPAddress);
  const reserve1 = await contract.methods.token1_reserve().call();
  const reserve2 = await contract.methods.token2_reserve().call();
  console.log("fetched reserves");
  return {
    reserve1: reserve1,
    reserve2: reserve2,
  };
}

export const calculateSwapAforB = async (amountIn, reserve1, reserve2) => {
  console.log('hi');
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

export const calculateSwapBforA = async (amountIn, reserve1, reserve2) => {
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