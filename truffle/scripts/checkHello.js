// scripts/interactWithContract.js

const MyContract = artifacts.require("helloworld");

module.exports = async function (callback) {
  try {
    // Get the deployed instance of your contract
    const myContract = await MyContract.deployed();

    // If you want to call a view function, you can do it like this:
    const data = await myContract.getMessage();
    console.log(data);

    // Handle more interactions here...
  } catch (error) {
    console.error("Error while interacting with the contract:", error);
  }

  // Terminate the script
  callback();
};
