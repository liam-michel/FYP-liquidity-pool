"use client";
import BigNumber from "bignumber.js";
import * as React from "react";
import { useState, useEffect } from "react"; // Import useState
import useDebounce, { useDebounceFunc } from "./Debounce";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { calculateAtoBLiquidity, calculateBtoALiquidity } from "@/lib/serverFunctions";

export default function Deposit({ reserve1, reserve2 }) {
  const [slippage, setSlippage] = useState(1);
  const [tokenA, setTokenA] = useState(0);
  const [tokenB, setTokenB] = useState(0);

  const handleSlippageChange = (value) => {
    if (!isNaN(value) && value >= 0 && value <= 10) {
      setSlippage(value);
    }
  };

  const handleSwapAforB = async (value) => {
    console.log(value)
    if (value[0]) {
      let res = await calculateAtoBLiquidity(value, reserve1, reserve2)
      setTokenB(res)
    }
  }

  const handleSwapBforA = async (value) => {
    console.log(value)
    if (value[0]) {
      let res = await calculateBtoALiquidity(value, reserve1, reserve2)
      setTokenA(res)
    }
  }
  const debouncedAtoB = useDebounceFunc(handleAtoB, 500);
  const debouncedBtoA = useDebounceFunc(handleBtoA, 500);


  return (
    <TabsContent value="deposit">
      <Card className="tab-card">
        <CardHeader>
          <CardTitle>Add Liquidity</CardTitle>
          <CardDescription>
            Here you can deposit equal ratios of Token A and Token B in return
            for some LP tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="current">Count of Token A to deposit</Label>
            <Input
              id="current"
              type="number"
              placeholder="Amount"
              value={tokenA}
              onChange={(e) => {
                const value = e.target.value;
                console.log(value);
                const isNumeric = /^\d+(\.\d+)?$/.test(value);
                if (isNumeric || value === "") {
                  setTokenA(value);
                  setLastEdited("A");
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new">Count of Token B to deposit</Label>
            <Input
              id="new"
              type="number"
              placeholder="Amount"
              value={tokenB}
              onChange={(e) => {
                const value = e.target.value;
                console.log(value);
                const isNumeric = /^\d+(\.\d+)?$/.test(value);
                if (isNumeric || value === "") {
                  setTokenB(value);
                  setLastEdited("B");
                } else {
                  setTokenA("");
                  setTokenB("");
                }
              }}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <div>
              <Label>Max acceptable Slippage (%)</Label>
            </div>
            <div className="w-full">
              <Slider
                value={[slippage]}
                max={10}
                step={0.05}
                onValueChange={(e) => handleSlippageChange(e)}
              />
            </div>
            <div>
              <Input
                type="number"
                className="w-full" // Ensure the input box also spans the full width if desired
                value={slippage}
                onChange={(e) => handleSlippageChange(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={(e) => callIncrement(e)}>Add Liquidity</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
