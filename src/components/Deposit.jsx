import * as React from "react";
import { useState, useEffect } from "react"; // Import useState
import { callIncrement } from "@/lib/testContract";

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

export default function Deposit() {
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
            <Input id="current" type="deposit" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new">Count of Token B to deposit</Label>
            <Input id="new" type="deposit" />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={(e) => callIncrement(e)}>Add Liquidity</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
