const MyContract = artifacts.require("helloworld");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(MyContract, { from: accounts[0] });
  const deployed = await MyContract.deployed();
  console.log(deployed.address);
};
