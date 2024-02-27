"use client";
import * as React from "react";
import { useState, useEffect } from "react"; // Import useState
import { addTokensToWallet } from "@/lib/addTokenAddresses";
import { useSDK } from "@metamask/sdk-react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Swap from "@/components/Swap.jsx";
import Deposit from "@/components/AddLiquidity";
import RemoveLiquidity from "@/components/RemoveLiquidity";
import MintTokens from "@/components/MintTokens";
import {
  readReserves,
  readTokenABalance,
  readTokenBBalance,
} from "@/lib/serverFunctions";
import "../styles/styles.css";
import { Label } from "@/components/ui/label";
export function PoolTabs({ reserve1, reserve2 }) {
  const { sdk, connected, connecting, account } = useSDK();
  const [reserves, setReserves] = useState({
    reserve1: reserve1,
    reserve2: reserve2,
  });
  const [tokenBalances, setTokenBalances] = useState({
    tokenABalance: 0,
    tokenBBalance: 0,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reloadBalances = async () => {
    if (connected == true) {
      const tokenABalance = await readTokenABalance(account);
      const tokenBBalance = await readTokenBBalance(account);
      setTokenBalances({
        tokenABalance: tokenABalance,
        tokenBBalance: tokenBBalance,
      });
    }
  };

  const reloadReserves = async () => {
    const { reserve1, reserve2 } = await readReserves();
    setReserves({ reserve1: reserve1, reserve2: reserve2 });
  };
  useEffect(() => {
    const interval = setInterval(() => {
      reloadReserves();
      reloadBalances();
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, reloadBalances]);

  return (
    <>
      <div className="flex gap-15">
        <div>
          <Label style={{ color: "cyan" }}>
            Reserve Balance: {Number(reserves.reserve1 / BigInt(1e18))}
          </Label>
          <div></div>
          <Label style={{ color: "cyan" }}>
            Reserve Balance: {Number(reserves.reserve2 / BigInt(1e18))}
          </Label>
        </div>
        {connected ? (
          <div className="ml-4">
            <Label style={{ color: "cyan" }}>
              Token A Wallet Balance:{" "}
              {Number(tokenBalances.tokenABalance / BigInt(1e18))}
            </Label>
            <div></div>
            <Label style={{ color: "cyan" }}>
              Token B Wallet Balance:{" "}
              {Number(tokenBalances.tokenBBalance / BigInt(1e18))}
            </Label>
          </div>
        ) : (
          <></>
        )}
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
      <Tabs defaultValue="swap" className="w-[550px]">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="addliquidity">Add Liquidity</TabsTrigger>
          <TabsTrigger value="removeliquidity">Remove Liquidity</TabsTrigger>
          <TabsTrigger value="minttokens">Mint Tokens</TabsTrigger>
        </TabsList>

        <Swap
          reserve1={reserve1}
          reserve2={reserve2}
          tokenABalance={tokenBalances.tokenABalance}
          tokenBBalance={tokenBalances.tokenBBalance}
        ></Swap>
        <Deposit
          reserve1={reserve1}
          reserve2={reserve2}
          tokenABalance={tokenBalances.tokenABalance}
          tokenBBalance={tokenBalances.tokenBBalance}
        ></Deposit>
        <RemoveLiquidity></RemoveLiquidity>
        <MintTokens></MintTokens>
      </Tabs>
    </>
  );
}
