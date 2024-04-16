const MyContract = artifacts.require("helloworld");

module.exports = async function (deployer) {
  await deployer.deploy(MyContract);
  const deployed = await MyContract.deployed();
  console.log(deployed.address);
};
