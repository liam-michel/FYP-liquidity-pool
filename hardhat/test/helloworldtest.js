import { assert } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
const helloWorldFactory = await ethers.getContractFactory("helloworld");
describe("hello world test", () => {
  it("should return Hello World! when fetching original message", async () => {
    const [owner] = await ethers.getSigners();
    const myContract = await ethers.deployContract("helloworld");
    const originalMessage = await myContract.getMessage();
    await myContract.setMessage("New Message sir!");
    const newMessage = await myContract.getMessage();
    assert.equal(
      originalMessage,
      "Hello World!",
      "Original message is not correct"
    );
    assert.equal(
      newMessage,
      "New Message sir!",
      "new message not set correctly"
    );
  });
});
