import Web3 from "web3";
import { t1Address, t2Address } from "./constants";

const rpcUrl = "https://rpc.sepolia.org";

export const addTokensToWallet = async () => {
  try {
    const { ethereum } = window;
    // const accounts = await ethereum.request({
    //   method: "eth_requestAccounts",
    // });
    await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: "0xFf3De7b417E52C26a5D9F36ED5D32b5d0F3EFb3A", // ERC20 token address
          symbol: `HE`,
          decimals: 18,
        },
      },
    });
  } catch (ex) {
    // We don't handle that error for now
    // Might be a different wallet than Metmask
    // or user declined
    console.error(ex);
  }
};
