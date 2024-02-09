'use client';
import * as React from "react";
import { useState, useEffect } from "react"; // Import useState

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { callAccounts, callIncrement, readCount } from "@/lib/contractFuncs";
import '../styles/styles.css';

export function SwapForm() {
  // Define a state to track if the tokens are swapped
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
    <Card className="w-[350px]" style={{background: 'turquoise'}}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle style={{ fontSize: '1.25rem'}}>{!isSwapped? "Token Swap A to B": "Token Swap B to A"}</CardTitle>
          <Avatar>
            <AvatarImage src="two-arrows.svg" onClick={() => setIsSwapped(!isSwapped)} className="shadow-hover-effect" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
        <CardDescription>Enter amount of Token A / B You would like to swap</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="tokenA">{isSwapped ? "Token B Count" : "Token A Count"}</Label>
              <Input id="tokenA" placeholder="Amount" value={!isSwapped? tokenA: tokenB} onChange={e => !isSwapped? setTokenA(e.target.value): setTokenB(e.target.value)}  />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="tokenB">{isSwapped ? "Token A Count" : "Token B Count"}</Label>
              <Input id="tokenB" placeholder="Amount" value={!isSwapped? tokenB: tokenA} onChange = {e => !isSwapped? setTokenB(e.target.value): setTokenA(e.target.value)} />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="Slippage">Slippage Limit (%)</Label>
              <Input id="slippage" placeholder="Percentage"/>
            </div>

          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button style={{ padding: '10px 20px', fontSize: '1.25rem' }} onClick = {e => console.log('hi')}>Swap</Button>
      </CardFooter>
    </Card>
  );
}
