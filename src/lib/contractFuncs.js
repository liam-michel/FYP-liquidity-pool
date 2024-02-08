'use client';
import Web3 from 'web3';
import {abi} from './abi.js'

export const rpcUrl = "https://rpc.sepolia.org";
export const web3 = new Web3(rpcUrl);  

export const contractAddress = "0x7d40a1C72dABA9a10CBAFcC2c8beEbc2c76d393c"

export const contract = new web3.eth.Contract(abi, contractAddress);

export const readFromContract = async() =>{
  const count = await contract.methods.viewCount().call();
  console.log(Number(count));

  //console.log("Name: ", count);
}


export const callIncrement = async (e) => {
  e.preventDefault();
  //fetch account
  accounts = await ethereum.request({method: 'eth_requestAccounts'});
  account = accounts[0];

  await contract.methods.increment().call({from: account});
  
}
