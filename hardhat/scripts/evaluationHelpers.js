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
export function simulateBrownianMotion(initialValue, mu, sigma, dt, steps) {
  let S = initialValue; // Starting asset ratio
  const results = [S];
  for (let i = 0; i < steps - 1; i++) {
    let epsilon = generateNormal();
    S += mu * dt + sigma * epsilon * Math.sqrt(dt);
    results.push(S);
  }

  return results;
}
// const mu = 0.0001;     // Example drift
// const sigma = 0.01;    // Example volatility
// const dt = 1;          // Time increment (e.g., days)
// const steps = 100;     // Number of steps in the simulation

const mu = 0;
const sigma = 1;
const dt = 1;
const steps = 1000;
const brownian = simulateBrownianMotion(mu, sigma, dt, steps);
// brownian.forEach((element) => {
//   console.log(element);
// });
// console.log(brownian.length);
