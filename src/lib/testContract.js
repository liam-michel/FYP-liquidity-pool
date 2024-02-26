import Web3 from "web3";
import { testAddress, incrementABI } from "./constants";

export const callIncrement = async () => {
  const web3 = new Web3(window.ethereum);
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const account = accounts[0]; // Use the first account
  const contract = new web3.eth.Contract(incrementABI, testAddress);
  try {
    const transaction = contract.methods.setCount(20);
    const gas = await transaction.estimateGas({ from: account });
    const gasPrice = await web3.eth.getGasPrice();
    const result = await transaction
      .send({ from: account, gas, gasPrice })
      .on("receipt", (receipt) => {
        console.log("Transaction was successful: ", receipt);
      });

    console.log("Received count value is: ", result);
  } catch (error) {
    console.error("User has rejected the transaction");
  }
};
