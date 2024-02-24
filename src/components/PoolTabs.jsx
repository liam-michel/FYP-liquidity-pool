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
import { readReserves } from "@/lib/liquidityPoolFuncs";
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
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div>
        <Label style={{ color: "green" }}>
          Reserve A has balance: {reserves.reserve1}
        </Label>
        <div></div>
        <Label style={{ color: "green" }}>
          Reserve B has balance: {reserves.reserve2}
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
        <Deposit></Deposit>
        <MintTokens></MintTokens>
      </Tabs>
    </>
  );
}
