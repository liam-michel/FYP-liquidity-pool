'use client';
import * as React from "react";
import { useState, useEffect } from "react"; // Import useState

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { callAccounts, callIncrement, readCount } from "@/lib/contractFuncs";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import '../styles/styles.css';

export function SwapAndDeposit() {
  const [isSwapped, setIsSwapped] = useState(false);
  const [tokenA, setTokenA] = useState(0);
  const [tokenB, setTokenB] = useState(0);
  const [count, setCount] = useState(0);



  useEffect(() => {
    if(!isSwapped){
      //then I need to update the value in 2nd box
      setTokenB(tokenA * 2)
    }else{
      setTokenA(tokenB / 2);
    }
  }, [tokenA, tokenB])


  useEffect(() =>{
    const fetchCount = async () => {
      const fetchedCount = await readCount();
      setCount(fetchedCount);
    };
    fetchCount().catch(console.error);
  }, [])

  return (
    <Tabs defaultValue="swap" className="w-[400px]" >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="swap">Swap</TabsTrigger>
        <TabsTrigger value="deposit">Deposit</TabsTrigger>
      </TabsList>
      <TabsContent value="swap">
        <Card className = "tab-card" style = {{background: 'turquoise'}}>
          <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Swap</CardTitle>
              <Avatar>
                <AvatarImage src="two-arrows.svg" onClick={() => setIsSwapped(!isSwapped)} className="shadow-hover-effect" />
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
              <Input placeholder="Amount" value={!isSwapped? tokenA: tokenB} onChange={e => !isSwapped? setTokenA(e.target.value): setTokenB(e.target.value)}  />
            </div>
            <div className="space-y-1">
            <Label>{isSwapped ? "Token A Count" : "Token B Count"}</Label>
              <Input placeholder="Amount" value={!isSwapped? tokenB: tokenA} onChange = {e => !isSwapped? setTokenB(e.target.value): setTokenA(e.target.value)} />
            </div>
            <div className="space-y-1">
            <Label>Slippage (%)</Label>
              <Input placeholder="Amount"/>
            </div>
          </CardContent>
          <CardFooter className = "flex justify-center items-center">
            <Button>Swap</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="deposit">
        <Card className = "tab-card">
          <CardHeader>
            <CardTitle>Deposit</CardTitle>
            <CardDescription>
              Change your deposit here. After saving, you'll be logged out.
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
    </Tabs>
  )
}
