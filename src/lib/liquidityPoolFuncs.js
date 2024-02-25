"use server";
import BigNumber from "bignumber.js";
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
  return {
    reserve1: reserve1,
    reserve2: reserve2,
  };
}

export const calculateBforA = (reserve1, reserve2, A) => {
  return (BigInt(A) * reserve2) / reserve1;
};

export const calculateAforB = (reserve1, reserve2, B) => {
  return (BigInt(B) * reserve1) / reserve2;
};

//bool = false => We are swapping token A for token B
//bool = true => we are swapping token B for token A

const calculateSwapAforB = (amountIn, reserve1, reserve2) => {
  console.log("HERERERRE");
  const withFees = new BigNumber(amountIn).times(1e18).times(0.997);
  console.log("Adjusted amount in: ", withFees.toString());
  const amountOut = reserve2
    .times(withFees)
    .div(reserve1.plus(withFees))
    .integerValue(BigNumber.ROUND_DOWN);
  console.log(amountOut);
};

const calculateSwapBforA = (amountIn, reserve1, reserve2) => {
  const withFees = new BigNumber(amountIn).times(1e18).times(0.997);
  console.log("Adjusted amount in: ", withFees.toString());
  const amountOut = reserve1
    .times(withFees)
    .div(reserve2.plus(withFees))
    .integerValue(BigNumber.ROUND_DOWN);
  console.log(amountOut);
};

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
