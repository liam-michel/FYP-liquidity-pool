"use client";
import { useState } from "react"; // Import useState
import { useDebounceFunc } from "./Debounce";
import { callSwap } from "@/lib/liquidity-frontend";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import _debounce from "lodash.debounce";
import { calculateSwapAforB, calculateSwapBforA } from "@/lib/serverFunctions";
export default function Swap({
  reserve1,
  reserve2,
  tokenABalance,
  tokenBBalance,
}) {
  const [isSwapped, setIsSwapped] = useState(false);
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");
  const [slippage, setSlippage] = useState(0.1);

  const isNumeric = (value) => {
    return /^\d+(\.\d+)?$/.test(value);
  };

  const wipeInputs = () => {
    setTokenA("");
    setTokenB("");
  };

  const handleSwapAforB = async (value) => {
    console.log(value);
    if (value[0]) {
      let res = await calculateSwapAforB(value, reserve1, reserve2);
      setTokenB(res);
    }
  };

  const handleSwapBforA = async (value) => {
    console.log(value);
    if (value[0]) {
      let res = await calculateSwapBforA(value, reserve1, reserve2);
      setTokenA(res);
    }
  };

  const debouncedCalcSwapAforB = useDebounceFunc(handleSwapAforB, 500);
  const debouncedCalcSwapBforA = useDebounceFunc(handleSwapBforA, 500);
  const debouncedWipeInputs = useDebounceFunc(wipeInputs, 500);

  const handleSlippageChange = (value) => {
    if (!isNaN(value) && value >= 0 && value <= 10) {
      setSlippage(value);
    }
  };

  return (
    <TabsContent value="swap">
      <Card className="tab-card" style={{ background: "LightSlateGray" }}>
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
          <CardDescription className="text-black">
            Enter amount of Token A / B You would like to swap
          </CardDescription>
          <CardDescription className="text-black">
            Toggle swap direction with the button in the top right
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label>{isSwapped ? "Token B Count" : "Token A Count"}</Label>
            <Input
              placeholder="Amount"
              value={!isSwapped ? tokenA : tokenB}
              onChange={(e) => {
                const value = e.target.value;
                if (!isSwapped && isNumeric(value)) {
                  setTokenA(value);
                  debouncedCalcSwapAforB(value);
                } else if (isNumeric(value)) {
                  setTokenB(value);
                  debouncedCalcSwapBforA(value);
                } else {
                  debouncedWipeInputs();
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>{isSwapped ? "Token A Count" : "Token B Count"}</Label>
            <Input
              placeholder="Amount"
              value={!isSwapped ? tokenB : tokenA}
              onChange={(e) => {
                const value = e.target.value;
                if (!isSwapped && isNumeric(value)) {
                  setTokenB(value);
                  debouncedCalcSwapBforA(value);
                } else if (isNumeric(value)) {
                  setTokenA(value);
                  debouncedCalcSwapAforB(value);
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
        <CardFooter className="flex justify-center items-center">
          <Button
            onClick={async (e) => {
              setTokenA(1);
              setTokenB(2);
              if (isNumeric(tokenA) && isNumeric(tokenB)) {
                if (!isSwapped) {
                  //initiate swap token A => token B
                  await callSwap(tokenA, tokenB, slippage, false);
                  //await callIncrement();
                } else {
                  await callSwap(tokenA, tokenB, slippage, true);
                }
              } else {
                console.log("No values");
              }
            }}
          >
            Swap
          </Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
