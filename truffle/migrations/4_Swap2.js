const MyContract = artifacts.require("SwapToken");

module.exports = function (deployer) {
  deployer.deploy(MyContract, 0, "SwapToken2", "SWP2");
};
