const MyContract = artifacts.require("SwapToken");

module.exports = function (deployer) {
  deployer.deploy(MyContract);
};
