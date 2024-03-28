"use client";

import { t1Address, t2Address } from "@/lib/constants";
import { removeLiquidity } from "@/lib/liquidity-frontend";
import * as React from "react";
import { useState } from "react";
import { useSDK } from "@metamask/sdk-react";
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
  const [shares, setShares] = useState("");

  const isNumeric = (value) => {
    return /^\d+(\.\d+)?$/.test(value);
  };

  return (
    <TabsContent value="removeliquidity">
      <Card className="tab-card" style={{ background: "LightSlateGray" }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Remove Liquidity</CardTitle>
          </div>
          <CardDescription className="text-black">
            Here you can remove liquidity from the pool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label>Number of Shares to burn</Label>
            <Input
              placeholder="Amount"
              value={shares}
              onChange={(e) => {
                const value = e.target.value;
                if (isNumeric(value)) {
                  setShares(value);
                } else {
                  setShares(""); // Reset if input is not numeric
                }
              }}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-center items-center">
          <Button
            onClick={async (e) => {
              if (isNumeric(shares)) {
                await removeLiquidity(shares);
                setTokenA("");
                setTokenB("");
              }
            }}
          >
            Remove Liquidity
          </Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
