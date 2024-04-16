// scripts/interactWithContract.js

const MyContract = artifacts.require("helloworld");

module.exports = async function (callback) {
  try {
    // Get the deployed instance of your contract
    const myContract = await MyContract.deployed();

    // Execute a function from your contract
    const txResult = await myContract.setMessage("Hello, World!");

    // Log the transaction result
    console.log(txResult);

    // If you want to call a view function, you can do it like this:
    const data = await myContract.getMessage();
    console.log(data);

    const newValue = await myContract.setMessage("hello sir");
    const fetchednew = await myContract.getMessage();
    console.log("new value is: ", fetchednew);

    // Handle more interactions here...
  } catch (error) {
    console.error("Error while interacting with the contract:", error);
  }

  // Terminate the script
  callback();
};
