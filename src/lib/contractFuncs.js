
import Web3 from 'web3';
import {abi} from './abi.js'

export const readCount = async() =>{
  const count = await contract.methods.viewCount().call();
  return (Number(count));

  //console.log("Name: ", count);
}


export const callAccounts = async (e) => {
  e.preventDefault();
  //fetch account
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  console.log(accounts);
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  console.log(chainId);
  const allAccounts = await window.ethereum.request({ method: 'eth_accounts' });
  console.log(allAccounts);

}

export const callIncrement = async(e) => {
  const rpcUrl = "https://rpc.sepolia.org";
  const web3 = new Web3(window.ethereum);  

  const contractAddress = "0x7d40a1C72dABA9a10CBAFcC2c8beEbc2c76d393c"

  const contract = new web3.eth.Contract(abi, contractAddress);

  e.preventDefault();
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  const account = accounts[0]
  await contract.methods.increment().send({from: account});
  console.log('done')
  
}


