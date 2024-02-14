"use client";

import { t1Address, t2Address } from "@/lib/constants";

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
  // State and effects can be defined here if needed
  const { sdk, connected, connecting, account } = useSDK();

  return (
    <TabsContent value="gettokens">
      <Card className="tab-card">
        <CardHeader>
          <CardTitle>Fetch Token A and Token B</CardTitle>
          <CardDescription>
            Here you can mint some token A and token B for swaps / liqudity
            deposits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Parent div for two columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* First Column */}
            <div className="space-y-2">
              <Label htmlFor="current">Token A Count</Label>
              <Input id="current" type="text" />{" "}
              {/* Assuming type should be text */}
              <Button>Mint Token A</Button>
            </div>
            {/* Second Column */}
            <div className="space-y-2">
              <Label htmlFor="new">Token B Count</Label>
              <Input id="new" type="text" /> <Button>Mint Token B</Button>
              {/* Assuming type should be text */}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
