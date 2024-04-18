const helloworld = artifacts.require("helloworld");
module.exports = async function (callback) {
  const myContract = await helloworld.new();
  const accounts = await web3.eth.getAccounts();
  const message = await myContract.getMessage();
  console.log(message);
  await myContract.setMessage("this is the new message");
  const newMessage = await myContract.getMessage();
  console.log(newMessage);
  callback();
};
