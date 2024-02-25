import BigNumber from "bignumber.js";

import {
  LiquidityPoolABI,
  LPAddress,
  t2Address,
  t1Address,
} from "./constants.js";

import Web3 from "web3";

const convertToWei = (tokenACount, tokenBCount) => {
  return {
    conv_A: Web3.utils.toWei(tokenACount, "ether"),
    conv_B: Web3.utils.toWei(tokenBCount, "ether"),
  };
};

export const callSwap = async (tokenACount, tokenBCount, slippage, bool) => {
  //use math.floor to round down (safe assumption rather than rounding up)
  const roundedSlippage = Math.floor(slippage * 100) / 100;
  console.log("Amount of Token A: ", tokenACount);
  console.log("Amount out Token B: ", tokenBCount);
  console.log("Slippage: ", roundedSlippage);

  const { conv_A, conv_B } = convertToWei(tokenACount, tokenBCount);

  const web3 = new Web3(window.ethereum);
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const account = accounts[0]; // Use the first account
  const contract = new web3.eth.Contract(LiquidityPoolABI, LPAddress);
  //do swap from token A => tokenB
  try {
    let transaction;
    if (bool == false) {
      console.log("Swapping Token A for Token B");
      const minimum = new BigNumber(tokenBCount)
        .times(100 - slippage)
        .div(100)
        .decimalPlaces(18, BigNumber.ROUND_DOWN)
        .toString();
      transaction = contract.methods.slippage_swap(
        t1Address,
        conv_A,
        conv_B,
        Web3.utils.toWei(minimum, "ether")
      );

      //do swap from token B to token A
    } else {
      console.log("Swapping Token B for Token A");
      const minimum = new BigNumber(tokenACount)
        .times(100 - slippage)
        .div(100)
        .decimalPlaces(18, BigNumber.ROUND_DOWN)
        .toString();
      transaction = contract.methods.slippage_swap(
        t2Address,
        conv_B,
        conv_A,
        Web3.utils.toWei(minimum, "ether")
      );
    }
    const gas = await transaction.estimateGas({ from: account });
    const gasPrice = await web3.eth.getGasPrice();

    await transaction
      .send({ from: account, gas: gas, gasPrice: gasPrice })
      .on("receipt", (receipt) => {
        console.log("Transaction was successful");
        return true;
      })
      .on("error", (error, receipt) => {
        if (receipt) {
          console.log(
            "Transaction failed after being included in the blockchain:",
            receipt
          );
        } else {
          console.log(
            "Transaction failed before being included in the blockchain:",
            error
          );
        }
      });
  } catch (error) {
    console.error("An error occured with the transaction ", error);
  }
};

export const addLiquidity = async (tokenA, tokenB, slippage) => {
  try {
    const roundedSlippage = Math.floor(slippage * 100) / 100;
    const { conv_A, conv_B } = convertToWei(tokenA, tokenB);
    const web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = accounts[0]; // Use the first account
    const contract = new web3.eth.Contract(LiquidityPoolABI, LPAddress);
    const transaction = contract.methods.addLiquidity(
      conv_A,
      conv_B,
      roundedSlippage
    );
  } catch (error) {
    console.error("An error has occured: ", error);
  }
};
