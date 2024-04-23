import pkg from 'hardhat';
const {ethers} = pkg;
const {parseEther} = ethers;
const SwapTokenFactory = await ethers.getContractFactory('SwapToken');
const LpTokenFactory = await ethers.getContractFactory('LpToken');
const LiquidityPoolFactory = await ethers.getContractFactory('LiquidityPool');
const DynamicLiquidityPoolFactory = await ethers.getContractFactory('DynamicLiquidityPool');
import * as math from 'mathjs'
//deploy the regular 

import {simulateBrownianMotion, simulatePoissonProcess } from './evaluationHelpers.js';

const setupLiquidityPool = async () => {
  const [owner] = await ethers.getSigners();
  const swap1 = await SwapTokenFactory.deploy(0n, 'SwapToken1', 'SWP1');
  const swap2 = await SwapTokenFactory.deploy(0n, 'SwapToken2', 'SWP2');
  const lpToken = await LpTokenFactory.deploy(0n, 'LpToken', 'LP');  
  const liquidityPool = await LiquidityPoolFactory.deploy(swap1, swap2, lpToken); 
  await lpToken.transferOwnership(liquidityPool);
  return [swap1, swap2, lpToken, liquidityPool]
}

const setupDynamicLiquidityPool = async () => {
  const [owner] = await ethers.getSigners();
  const swap1 = await SwapTokenFactory.deploy(0n, 'SwapToken1', 'SWP1');
  const swap2 = await SwapTokenFactory.deploy(0n, 'SwapToken2', 'SWP2');
  const lpToken = await LpTokenFactory.deploy(0n, 'LpToken', 'LP');  
  const liquidityPool = await DynamicLiquidityPoolFactory.deploy(swap1, swap2, lpToken); 
  await lpToken.transferOwnership(liquidityPool);
  return [swap1, swap2, lpToken, liquidityPool]
}

const mu = 0.0001;     // Example drift
const sigma = 0.01;    // Example volatility
const dt = 1;          // Time increment (e.g., days)
const steps = 100;     // Number of steps in the simulation

const lambda = 5;
const duration = 100;
const main = async () => {
  //setup regular Liquidity Pool
  const [regularswap1, regularswap2, regularlpToken, regularPool] = await setupLiquidityPool();
  const [dynamicswap1, dynamicswap2, dynamiclpToken, dynamicPool] = await setupDynamicLiquidityPool();
  const assetRatios = simulateBrownianMotion(mu, sigma, dt, steps);
  const transactionVolume = simulatePoissonProcess(lambda, duration);
  console.log(assetRatios.length);
  console.log(transactionVolume.length);
  
  //setup Impermanent loss tracker
  //keep map of 
}
  
await main();