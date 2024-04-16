const MyContract = artifacts.require("LiquidityPool");

module.exports = function (deployer) {
  deployer.deploy(MyContract);
};
