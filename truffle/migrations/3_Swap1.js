const MyContract = artifacts.require("SwapToken");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(MyContract, 0, "SwapToken1", "SWP1", { from: accounts[0] });
};
