const MyContract = artifacts.require("helloworld");

module.exports = function (deployer) {
  deployer.deploy(MyContract);
};
