"use client";

import { t1Address, t2Address } from "@/lib/constants";

import * as React from "react";
import { useState } from "react";
import { useSDK } from "@metamask/sdk-react";
import { mintTokenA, mintTokenB } from "@/lib/liquidity-frontend";
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
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";

export default function MintTokens() {
  const { sdk, connected, connecting, account } = useSDK();
  const [tokenA, setTokenA] = useState(0);
  const [tokenB, setTokenB] = useState(0);
  const maxValue = 1000;

  const isNumeric = (value) => {
    return /^\d+(\.\d+)?$/.test(value);
  };

  return (
    <TabsContent value="minttokens">
      <Card className="tab-card" style={{ background: "LightSlateGray" }}>
        <CardHeader>
          <CardTitle>Mint # Token A and Token B</CardTitle>
          <CardDescription className="text-black">
            Here you can mint some token A and token B for swaps / liqudity
            deposits (Maximum 1000)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current">Token A Count</Label>
              <Input
                id="new"
                type="text"
                value={tokenA}
                onChange={(e) => {
                  const value = e.target.value;
                  const maxValue = 1000; // Define the maximum value you want to allow
                  if (isNumeric(value) && +value <= maxValue) {
                    setTokenA(value);
                  } else if (isNumeric(value) && +value > maxValue) {
                    setTokenA(maxValue.toString()); // Set to maxValue if input exceeds it
                  } else {
                    setTokenA(""); // Reset if input is not numeric
                  }
                }}
              />
              <Button
                onClick={async (e) => {
                  if (isNumeric(tokenA)) {
                    await mintTokenA(tokenA);
                  }
                }}
              >
                Mint Token A
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">Token B Count</Label>
              <Input
                id="new"
                type="text"
                value={tokenB}
                onChange={(e) => {
                  const value = e.target.value;
                  const maxValue = 1000; // Define the maximum value you want to allow
                  if (isNumeric(value) && +value <= maxValue) {
                    setTokenB(value);
                  } else if (isNumeric(value) && +value > maxValue) {
                    setTokenB(maxValue.toString()); // Set to maxValue if input exceeds it
                  } else {
                    setTokenB(""); // Reset if input is not numeric
                  }
                }}
              />{" "}
              <Button
                onClick={async (e) => {
                  if (isNumeric(tokenB)) {
                    await mintTokenB(tokenB);
                  }
                }}
              >
                Mint Token B
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
