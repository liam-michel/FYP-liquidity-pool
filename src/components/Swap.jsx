import * as React from "react";
import { useState, useEffect } from "react"; // Import useState

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
export default function Swap() {
  const [isSwapped, setIsSwapped] = useState(false);
  const [tokenA, setTokenA] = useState(0);
  const [tokenB, setTokenB] = useState(0);
  const [slippage, setSlippage] = useState(1);

  const calculateSwapRate = () => {};

  useEffect(() => {
    if (!isSwapped) {
      //then I need to update the value in 2nd box
      setTokenB(tokenA * 2);
    } else {
      setTokenA(tokenB / 2);
    }
  }, [tokenA, tokenB, isSwapped]);

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
              placeholder="Amount"
              value={!isSwapped ? tokenA : tokenB}
              onChange={(e) =>
                !isSwapped
                  ? setTokenA(e.target.value)
                  : setTokenB(e.target.value)
              }
            />
          </div>
          <div className="space-y-1">
            <Label>{isSwapped ? "Token A Count" : "Token B Count"}</Label>
            <Input
              placeholder="Amount"
              value={!isSwapped ? tokenB : tokenA}
              onChange={(e) =>
                !isSwapped
                  ? setTokenB(e.target.value)
                  : setTokenA(e.target.value)
              }
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
              value={slippage}
              onChange={(e) => handleSlippageChange(e.target.value)}
              type="number"
            ></Input>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center items-center">
          <Button>Swap</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
