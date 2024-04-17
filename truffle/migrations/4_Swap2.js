const MyContract = artifacts.require("SwapToken");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(MyContract, 0, "SwapToken2", "SWP2", { from: accounts[0] });
};
