"use client";
import { useState, useEffect } from "react"; // Import useState
import useDebounce from "./Debounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { readReserves, calculateSwap } from "@/lib/liquidityPoolFuncs";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

export default function Swap({ reserve1, reserve2 }) {
  const [isSwapped, setIsSwapped] = useState(false);
  const [tokenA, setTokenA] = useState(0);
  const [tokenB, setTokenB] = useState(0);
  const [slippage, setSlippage] = useState(1);
  const [lastEdited, setLastEdited] = useState(null); // Track the last edited field

  const debouncedInputA = useDebounce(tokenA, 500);
  const debouncedInputB = useDebounce(tokenB, 500);

  const calculateSwapAforB = (amountIn) => {
    const amountWithFee = (amountIn * 997) / 1000;
    console.log(amountWithFee);
    const amountOut = (reserve2 * amountWithFee) / (reserve1 + amountWithFee);
    return amountOut;
  };

  const calculateSwapBforA = (amountIn) => {
    const amountWithFee = (amountIn * 997) / 1000;
    const amountOut = (reserve1 * amountWithFee) / (reserve2 + amountWithFee);
    return amountOut;
  };

  useEffect(() => {
    // Convert based on which input was last edited
    if (lastEdited === "A") {
      console.log("Editing A");

      const result = calculateSwapAforB(debouncedInputA);
      setTokenB(result);
    } else if (lastEdited === "B") {
      console.log("Editing B");
      const result = calculateSwapBforA(debouncedInputB);
      setTokenA(result);
    }
  }, [
    debouncedInputA,
    debouncedInputB,
    lastEdited,
    isSwapped,
    reserve1,
    reserve2,
  ]);

  const handleSlippageChange = (value) => {
    if (!isNaN(value) && value >= 0 && value <= 10) {
      setSlippage(value);
    }
  };

  return (
    <TabsContent value="swap">
      <Card className="tab-card" style={{ background: "turquoise" }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Swap</CardTitle>
            <Avatar>
              <AvatarImage
                src="two-arrows.svg"
                onClick={() => setIsSwapped(!isSwapped)}
                className="shadow-hover-effect"
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
          <CardDescription>
            Enter amount of Token A / B You would like to swap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label>{isSwapped ? "Token B Count" : "Token A Count"}</Label>
            <Input
              type="text"
              placeholder="Amount"
              value={!isSwapped ? tokenA : tokenB}
              onChange={(e) => {
                const value = e.target.value;
                // Allow numbers only, optionally uncomment the next line to allow decimals
                const isNumeric = /^\d+(\.\d+)?$/.test(value);
                if (isNumeric || value === "") {
                  if (!isSwapped) {
                    setTokenA(value);
                    setLastEdited("A");
                  } else {
                    setTokenB(value);
                    setLastEdited("B");
                  }
                } else {
                  setTokenA("");
                  setTokenB("");
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>{isSwapped ? "Token A Count" : "Token B Count"}</Label>
            <Input
              type="text"
              placeholder="Amount"
              value={!isSwapped ? tokenB : tokenA}
              onChange={(e) => {
                const value = e.target.value;
                // Allow numbers only, optionally uncomment the next line to allow decimals
                const isNumeric = /^\d+(\.\d+)?$/.test(value);
                console.log(isNumeric);
                if (isNumeric || value === "") {
                  if (!isSwapped) {
                    setTokenB(value);
                    setLastEdited("B");
                  } else {
                    setTokenA(value);
                    setLastEdited("A");
                  }
                } else {
                  setTokenA("");
                  setTokenB("");
                }
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label>Max acceptable Slippage (%)</Label>
            <Slider
              value={[slippage]}
              max={10}
              step={0.05}
              onValueChange={(e) => handleSlippageChange(e)}
            />
            <Input
              type="number"
              value={slippage}
              onChange={(e) => handleSlippageChange(e.target.value)}
            ></Input>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center items-center">
          <Button onClick={(e) => sendSwap()}>Swap</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
