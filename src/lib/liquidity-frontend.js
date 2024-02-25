import BigNumber from "bignumber.js";
import {
  LiquidityPoolABI,
  LPAddress,
  t2Address,
  t1Address,
} from "./constants.js";

import Web3 from "web3";

export const callSwap = async (tokenACount, tokenBCount, slippage, bool) => {
  //use math.floor to round down (safe assumption rather than rounding up)
  const roundedSlippage = Math.floor(slippage * 100) / 100;

  console.log("Amount of Token A: ", tokenACount);
  console.log("Amount out Token B: ", tokenBCount);
  console.log("Slippage: ", roundedSlippage);

  const web3 = new Web3(window.ethereum);
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const account = accounts[0]; // Use the first account
  const contract = new web3.eth.Contract(LiquidityPoolABI, LPAddress);
  //do swap from token A => tokenB
  try {
    if (bool == false) {
      console.log("Swapping Token A for Token B");
      const result = await contract.methods
        .slippage_swap(t1Address, tokenACount, tokenBCount, roundedSlippage)
        .call({ from: account });

      //do swap from token B to token A
    } else {
      console.log("Swapping Token B for Token A");
      const result = await contract.methods
        .slippage_swap(t2Address, tokenBCount, tokenACount, roundedSlippage)
        .call({ from: account });
    }
    console.log(result);

    // const gas = await contract.methods
    //   .estimateGas({ from: account });
    //   .swap(token, amountIn * 1e18)

    // contract.methods
    //   .send({ from: account, gas })
    //   .swap(tokenAddress, amountIn * 1e18)
    //   .on("receipt", (receipt) => {
    //     console.log("transaction successfully mined");
    //     console.log("Receipt: ", receipt);
    //   });
  } catch (error) {
    console.error(error);
  }
};

export const addLiquidity = async (tokenA, tokenB, slippage) => {
  const roundedSlippage = Math.floor(slippage * 100) / 100;
  console.log("Amount of Token A: ", tokenA);
  console.log("Amount out Token B: ", tokenB);
  const web3 = new Web3(window.ethereum);
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const account = accounts[0]; // Use the first account
  const contract = new web3.eth.Contract(LiquidityPoolABI, LPAddress);
};
