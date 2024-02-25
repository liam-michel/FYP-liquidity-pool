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
  "use server";
  const contract = new web3.eth.Contract(LiquidityPoolABI, LPAddress);
  const reserve1 = await contract.methods.token1_reserve().call();
  const reserve2 = await contract.methods.token2_reserve().call();
  console.log("fetched reserves");
  return {
    reserve1: reserve1,
    reserve2: reserve2,
  };
}
