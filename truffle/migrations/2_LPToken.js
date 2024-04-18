const MyContract = artifacts.require("LpToken");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(MyContract, 0, "LPToken", "LP", { from: accounts[0] });
};
