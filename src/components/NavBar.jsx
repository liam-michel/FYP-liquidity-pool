"use client";

import Link from "next/link";


import { Button } from "./ui/button";

import { useSDK, MetaMaskProvider } from "@metamask/sdk-react";
import { formatAddress } from "../lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export const ConnectWalletButton = () => {
  const { sdk, connected, connecting, account } = useSDK();

  const connect = async () => {
    try {
      await sdk?.connect();
    } catch (err) {
      console.warn(`No accounts found`, err);
    }
  };
 
  const disconnect = () => {
    if (sdk) {
      sdk.terminate();
    }
  };

  return (
    <div className="relative">
      {connected ? (
        <Popover>
          <PopoverTrigger asChild>
            <div className="cursor-pointer">
              <Button>{formatAddress(account)}</Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="mt-2 w-44 bg-gray-100 border rounded-md shadow-lg right-0 z-10 top-10">
            <button
              onClick={disconnect}
              className="block w-full pl-2 pr-4 py-2 text-left text-[#F05252] hover:bg-gray-200"
            >
              Disconnect
            </button>
          </PopoverContent>
        </Popover>
      ) : (
        <Button disabled={connecting} onClick={connect}>
           Connect Wallet
        </Button>
      )}
    </div>
  );
};


export const NavBar = () => {
  const host =
    typeof window !== "undefined" ? window.location.host : "defaultHost";

  const sdkOptions = {
    logging: { developerMode: false },
    checkInstallationImmediately: false,
    dappMetadata: {
      name: "Next-Metamask-Boilerplate",
      url: host, // using the host constant defined above
    },
  };

  return (
<nav className="flex items-center justify-between max-w-screen-xl px-6 mx-auto py-7 rounded-xl bg-">
  <div className="flex-1"> 
    {/* If you have a logo or other elements on the left side, they go here */}
  </div>
  <div className="flex gap-4 px-6 justify-end">
    <MetaMaskProvider debug={false} sdkOptions={sdkOptions}>
      <ConnectWalletButton />
    </MetaMaskProvider>
  </div>
</nav>
  );
};

export default NavBar;