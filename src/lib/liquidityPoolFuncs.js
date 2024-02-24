"use server";

import {
  rpc,
  LiquidityPoolABI,
  LPAddress,
  t1Address,
  t2Address,
} from "./constants.js";
import Web3 from "web3";

const web3 = new Web3(rpc);

export async function readReserves() {
  const contract = new web3.eth.Contract(LiquidityPoolABI, LPAddress);
  const reserve1 = await contract.methods.token1_reserve().call();
  const reserve2 = await contract.methods.token2_reserve().call();
  // console.log(reserve1);
  // console.log(reserve2);
  return {
    reserve1: Number(reserve1 / BigInt(1e18)),
    reserve2: Number(reserve2 / BigInt(1e18)),
  };
}

export const calculateBforA = (reserve1, reserve2, A) => {
  return (A * reserve2) / reserve1;
};

export const calculateAforB = (reserve1, reserve2, B) => {
  return (B * reserve1) / reserve2;
};

//bool = false => We are swapping token A for token B
//bool = true => we are swapping token B for token A

export const callSwap = async (amountIn, amountOut, slippage, token) => {
  try {
    const web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = accounts[0]; // Use the first account
    const contract = new web3.eth.Contract(LiquidityPoolABI, LPAddress);
    const gas = await contract.methods
      .swap(token, amountIn * 1e18)
      .estimateGas({ from: account });

    contract.methods
      .swap(tokenAddress, amountIn * 1e18)
      .send({ from: account, gas })
      .on("receipt", (receipt) => {
        console.log("transaction successfully mined");
        console.log("Receipt: ", receipt);
      });
  } catch (error) {
    console.error(error);
  }
};
