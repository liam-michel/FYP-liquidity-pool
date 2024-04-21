import Web3 from "web3";
import { t1Address, t2Address } from "./constants";
import { tokens } from "./constants";
const rpcUrl = "https://rpc.sepolia.org";

export const addTokensToWallet = async () => {
  try {
    const { ethereum } = window;
    // const accounts = await ethereum.request({
    //   method: "eth_requestAccounts",
    // });
    for (const token of tokens) {
      await ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: token.address, // ERC20 token address
            symbol: token.symbol,
            decimals: token.decimals,
          },
        },
      });
    }
  } catch (ex) {
    // We don't handle that error for nowdf
    // Might be a different wallet than Metmask
    // or user declined
    console.error(ex);
  }
};
