"use client";
import * as React from "react";
import { useState, useEffect } from "react"; // Import useState
import { callAccounts, callIncrement, readCount } from "@/lib/contractFuncs";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Swap from "@/components/Swap.jsx";
import Deposit from "@/components/Deposit";
import MintToken from "@/components/MintTokens";

import "../styles/styles.css";

export function SwapAndDeposit() {
  const [isSwapped, setIsSwapped] = useState(false);
  const [tokenA, setTokenA] = useState(0);
  const [tokenB, setTokenB] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isSwapped) {
      //then I need to update the value in 2nd box
      setTokenB(tokenA * 2);
    } else {
      setTokenA(tokenB / 2);
    }
  }, [tokenA, tokenB]);

  useEffect(() => {
    const fetchCount = async () => {
      const fetchedCount = await readCount();
      setCount(fetchedCount);
    };
    fetchCount().catch(console.error);
  }, []);

  return (
    <Tabs defaultValue="swap" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="swap">Swap</TabsTrigger>
        <TabsTrigger value="deposit">Deposit</TabsTrigger>
        <TabsTrigger value="getTokens">getTokens</TabsTrigger>
      </TabsList>
      <Swap
        isSwapped={isSwapped}
        setIsSwapped={setIsSwapped}
        tokenA={tokenA}
        setTokenA={setTokenA}
        tokenB={tokenB}
        setTokenB={setTokenB}
      ></Swap>

      <Deposit></Deposit>
      <MintToken></MintToken>
    </Tabs>
  );
}
