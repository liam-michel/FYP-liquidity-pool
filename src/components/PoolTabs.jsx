"use client";
import * as React from "react";
import { useState, useEffect } from "react"; // Import useState
import { addTokensToWallet } from "@/lib/addTokenAddresses";
import { useSDK } from "@metamask/sdk-react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Swap from "@/components/Swap.jsx";
import Deposit from "@/components/Deposit";
import MintTokens from "@/components/MintTokens";
import { readReserves } from "@/lib/serverFunctions";
import "../styles/styles.css";
import { Label } from "@/components/ui/label";
export function PoolTabs({ reserve1, reserve2 }) {
  const { sdk, connected, connecting, account } = useSDK();
  const [reserves, setReserves] = useState({
    reserve1: reserve1,
    reserve2: reserve2,
  });

  const reloadReserves = async () => {
    const { reserve1, reserve2 } = await readReserves();
    setReserves({ reserve1: reserve1, reserve2: reserve2 });
  };
  useEffect(() => {
    const interval = setInterval(() => {
      reloadReserves();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div>
        <Label style={{ color: "cyan" }}>
          Reserve A has balance: {Number(reserves.reserve1 / BigInt(1e18))}
        </Label>
        <div></div>
        <Label style={{ color: "cyan" }}>
          Reserve B has balance: {Number(reserves.reserve2 / BigInt(1e18))}
        </Label>
      </div>
      <Button
        style={{ marginBottom: "8px" }}
        onClick={(e) => addTokensToWallet()}
        disabled={!connected}
      >
        {connected
          ? "Add Test tokens to wallet"
          : "Add Test tokens to wallet - Connect Wallet first"}
      </Button>
      <Tabs defaultValue="swap" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="gettokens">getTokens</TabsTrigger>
        </TabsList>

        <Swap reserve1={reserve1} reserve2={reserve2}></Swap>
        <Deposit reserve1={reserve1} reserve2={reserve2}></Deposit>
        <MintTokens></MintTokens>
      </Tabs>
    </>
  );
}
