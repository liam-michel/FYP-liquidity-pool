"use client";
import * as React from "react";
import { useState } from "react"; // Import useState
import { useDebounceFunc } from "./Debounce";
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
import {
  calculateAtoBLiquidity,
  calculateBtoALiquidity,
} from "@/lib/serverFunctions";
import { addLiquidity } from "@/lib/liquidity-frontend";

export default function AddLiquidity({ reserve1, reserve2 }) {
  const [slippage, setSlippage] = useState(1);
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");

  const isNumeric = (value) => {
    return /^\d+(\.\d+)?$/.test(value);
  };

  const wipeInputs = () => {
    setTokenA("");
    setTokenB("");
  };

  const handleSlippageChange = (value) => {
    if (!isNaN(value) && value >= 0 && value <= 10) {
      setSlippage(value);
    }
  };

  const handleAtoB = async (value) => {
    if (isNumeric(value[0])) {
      console.log("calculating amount of token B");
      let res = await calculateAtoBLiquidity(value, reserve1, reserve2);
      setTokenB(res);
    }
  };

  const handleBtoA = async (value) => {
    if (isNumeric(value[0])) {
      console.log("calculating amount of token A");
      let res = await calculateBtoALiquidity(value, reserve1, reserve2);
      setTokenA(res);
    }
  };
  const debouncedAtoB = useDebounceFunc(handleAtoB, 500);
  const debouncedBtoA = useDebounceFunc(handleBtoA, 500);
  const debouncedWipeInputs = useDebounceFunc(wipeInputs, 500);

  return (
    <TabsContent value="addliquidity">
      <Card className="tab-card" style={{ background: "LightSlateGray" }}>
        <CardHeader>
          <CardTitle>Add Liquidity</CardTitle>
          <CardDescription className="text-black">
            Here you can deposit equal ratios of Token A and Token B in return
            for some LP tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="current">Count of Token A to deposit</Label>
            <Input
              id="current"
              placeholder="Amount"
              value={tokenA}
              onChange={(e) => {
                const value = e.target.value;
                if (isNumeric(value)) {
                  console.log("here");
                  setTokenA(value);
                  debouncedAtoB(value);
                } else {
                  debouncedWipeInputs();
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new">Count of Token B to deposit</Label>
            <Input
              id="new"
              placeholder="Amount"
              value={tokenB}
              onChange={(e) => {
                const value = e.target.value;
                if (isNumeric(value)) {
                  setTokenB(value);
                  debouncedBtoA(value);
                } else {
                  debouncedWipeInputs();
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
          <Button
            onClick={async (e) => {
              if (isNumeric(tokenA) && isNumeric(tokenB)) {
                await addLiquidity(tokenA, tokenB, slippage);
              }
            }}
          >
            Add Liquidity
          </Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
