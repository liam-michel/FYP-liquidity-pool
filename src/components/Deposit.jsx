import * as React from "react";
import { useState, useEffect } from "react"; // Import useState

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { callAccounts, callIncrement, readCount } from "@/lib/testContract";
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

export default function Deposit() {
  return (
    <TabsContent value="deposit">
      <Card className="tab-card">
        <CardHeader>
          <CardTitle>Deposit</CardTitle>
          <CardDescription>
            Change your deposit here. After saving, you will be logged out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="current">Current deposit</Label>
            <Input id="current" type="deposit" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new">New deposit</Label>
            <Input id="new" type="deposit" />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Save deposit</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
