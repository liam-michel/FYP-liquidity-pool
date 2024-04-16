const MyContract = artifacts.require("LpToken");

module.exports = function (deployer) {
  deployer.deploy(MyContract, 0, "LPToken", "LP");
};
