//purpose of this file is to compare the effectiveness of the regular
//AMM and my variable transaction fee implementation at addressing impermamanent loss
import pkg from "hardhat";
const { ethers } = pkg;
const { parseEther } = ethers;

//deploy the regular

//use Brownian motion for asset ratio volatility (external market);
//use Poisson process for transaction volume (external market);
const generateNormal = () => {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

function poissonRandomNumber(lambda) {
  let L = Math.exp(-lambda);
  let p = 1.0;
  let k = 0;

  do {
    k++;
    p *= Math.random();
  } while (p > L);

  return k - 1;
}

export function simulatePoissonProcess(lambda, duration) {
  const transactionCounts = [];

  for (let i = 0; i < duration; i++) {
    const count = poissonRandomNumber(lambda);
    transactionCounts.push(count);
  }

  return transactionCounts;
}
export function randomWalk(initialRatio, volatility, steps) {
  let currentRatio = initialRatio;
  let ratios = [initialRatio];
  for (let i = 0; i < steps; i++) {
    // Random change could be more sophisticated based on different distributions
    currentRatio *= Math.exp(volatility * (Math.random() - 0.5));
    ratios.push(currentRatio);
  }
  return ratios;
}
// const mu = 0.0001;     // Example drift
// const sigma = 0.01;    // Example volatility
// const dt = 1;          // Time increment (e.g., days)
// const steps = 100;     // Number of steps in the simulation

// brownian.forEach((element) => {
//   console.log(element);
// });
// console.log(brownian.length);
