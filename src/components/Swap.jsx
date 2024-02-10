import * as React from "react";
import { useState, useEffect } from "react"; // Import useState

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { callAccounts, callIncrement, readCount } from "@/lib/contractFuncs";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Swap({
  isSwapped,
  setIsSwapped,
  tokenA,
  setTokenA,
  tokenB,
  setTokenB,
}) {
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
          <div className="space-y-1">
            <Label>Max acceptable Slippage (%)</Label>
            <Input placeholder="Amount" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-center items-center">
          <Button>Swap</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
