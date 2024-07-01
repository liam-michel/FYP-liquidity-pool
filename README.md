# Liam Michel 6641319 FYP

# CRYPTO-CURRENCY LIQUIDITY POOLS WITH OFF-CHAIN DATA INTEGRATION FOR MITIGATING IMPERMANENT LOSS

## Before anything, rememember to run **npm install **

## How to run the front-end

To run the frontend simply run the command \
**npm run dev**

# File structure

**/src** contains all of the files pertaining to the basic react frontend demo for the basic liquidity pool. \
**/hardhat** contains all code pertaining to smart contracts, testing and evaluation of the fee mechanism. \
**Inside of /hardhat**

- /contracts contains all of the smart contracts **without** private functions. I had to remove private functions for unit testing so these contracts are not safe for actual deployment/use, only for testing.

* - **liquiditypool.sol** contains the base CPMM algorithm
* - **swapToken.sol** is the ERC20 token contract
* - **modifiedPool.sol** is an old modified pool that simply changes the fee between 0.3 and 1% (not actually used).
* - **variableFee.sol** contains all of the logic for the variable fee contract (final implementation).

- /deploy-contracts contains all of the same contracts as /contracts, but with appropriate function access restrictions
- /oldscripts contains miscellaneous JS scripts that I wrote during testing and evaluation but didn't end up using.
- /scripts contains scripts that were used for evaluation, this includes **smartArbitrage.js** which ran the different evaluation scenarios, and various files with helper functions.

* /test contains all of the unit tests for all of the smart contracts. All contracts were rigorously tested to ensure that they were behaving properly.
* /transResults is the output directory for the transaction results.
