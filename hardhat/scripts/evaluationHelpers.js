//purpose of this file is to compare the effectiveness of the regular
//AMM and my variable transaction fee implementation at addressing impermamanent loss
import pkg from 'hardhat';
const {ethers} = pkg;
const {parseEther} = ethers;

//deploy the regular 

//use Brownian motion for asset ratio volatility (external market);
//use Poisson process for transaction volume (external market);
export const generateNormal = () => {
  let u1 = 0, u2 = 0;
  // Avoid zero values for u1 and u2 which would result in math errors
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();

  const mag = Math.sqrt(-2.0 * Math.log(u1));
  const z0 = mag * Math.cos(2.0 * Math.PI * u2);
  // const z1 = mag * Math.sin(2.0 * Math.PI * u2); // You can use z1 as well if you need two values

  return z0; // This returns a normally distributed random number
}



export const simulateBrownianMotion = (mu, sigma, dt, steps) => {
  let S = 1;  // Starting asset ratio
  const results = [S];
  for (let i = 0; i < steps; i++) {
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

// const assetRatios = simulateBrownianMotion(mu, sigma, dt, steps);
// console.log(assetRatios);



export const  simulatePoissonProcess = (lambda, duration) => {
  let arrivals = [];
  let currentTime = 0;

  while (currentTime < duration) {
    let timeStep = -Math.log(1.0 - Math.random()) / lambda;
    currentTime += timeStep;
    if (currentTime < duration) {
      arrivals.push(currentTime);
    }
  }

  return arrivals;
}

// const lambda = 5;  // Average of 5 trades per unit time
// const duration = 100;  // Total time

// const tradeArrivals = simulatePoissonProcess(lambda, duration);
// console.log(tradeArrivals);

// console.log(assetRatios.length, tradeArrivals.length);