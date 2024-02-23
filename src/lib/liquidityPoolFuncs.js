"use server";

import { rpc, LiquidityPoolABI, LPAddress } from "./constants.js";
import Web3 from "web3";

const web3 = new Web3(rpc);

export async function readReserves() {
  const contract = new web3.eth.Contract(LiquidityPoolABI, LPAddress);
  const reserve1 = await contract.methods.token1_reserve().call();
  const reserve2 = await contract.methods.token2_reserve().call();
  return {
    reserve1: Number(reserve1),
    reserve2: Number(reserve2),
  };
}

export const calculateBforA = (reserve1, reserve2, A) => {
  return (A * reserve2) / reserve1;
};

export const calculateAforB = (reserve1, reserve2, B) => {
  return (B * reserve1) / reserve2;
};

export const calculateSwap = (reserve1, reserve2, amountIn, bool) => {
  if (bool == true) {
    amountWithFee = (amountIn * 997) / 1000;
    amountOut = (reserve2 * amountWithFee) / (reserve1 + amountWithFee);
    return amountOut;
  } else {
    amountWithFee = (amountIn * 997) / 1000;
    amountOut = (reserve1 * amountWithFee) / (reserve2 + amountWithFee);
    return amountOut;
  }
};

const { reserve1, reserve2 } = await readReserves();
console.log(reserve1);
console.log(reserve2);
