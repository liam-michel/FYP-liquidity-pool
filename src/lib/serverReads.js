"use server";

import { rpc, testContractABI } from "./constants.js";
import Web3 from "web3";

export const readCount = async () => {
  const web3 = new Web3(rpc);
  const contractAddress = "0x7d40a1C72dABA9a10CBAFcC2c8beEbc2c76d393c";
  const contract = new web3.eth.Contract(testContractABI, contractAddress);
  const count = await contract.methods.viewCount().call();
  console.log(Number(count));
  return Number(count);
};
