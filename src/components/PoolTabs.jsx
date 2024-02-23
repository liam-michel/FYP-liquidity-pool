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

import "../styles/styles.css";

export function PoolTabs({ reserve1, reserve2 }) {
  const { sdk, connected, connecting, account } = useSDK();

  return (
    <>
      <Button
        style={{ marginBottom: "8px" }}
        onClick={(e) => addTokensToWallet()}
        disabled={!connected}
      >
        {connected
          ? "Add Test tokens to wallet"
          : "Add Test tokens to wallet - Connect Wallet first"}
      </Button>
      <Button onClick={(e) => reloadCount()}>Hi</Button>
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
