const LPToken = artifacts.require("LpToken");
const SwapToken = artifacts.require("SwapToken"); // Using the same artifact for both Swap1 and Swap2
const LiquidityPool = artifacts.require("LiquidityPool");

module.exports = async function (deployer) {
  await deployer.deploy(LPToken, 0, "LPToken", "LP");
  const lpToken = await LPToken.deployed();

  await deployer.deploy(SwapToken, 0, "SwapToken1", "SWP1");
  const swap1 = await SwapToken.deployed();

  await deployer.deploy(SwapToken, 0, "SwapToken2", "SWP2");
  const swap2 = await SwapToken.deployed();

  console.log("LPtoken address:", lpToken.address);
  console.log("Swap1 address:", swap1.address);
  console.log("Swap2 address:", swap2.address);
};
