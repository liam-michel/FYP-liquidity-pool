const MyContract = artifacts.require("LPToken");

module.exports = function (deployer) {
  deployer.deploy(MyContract);
};
