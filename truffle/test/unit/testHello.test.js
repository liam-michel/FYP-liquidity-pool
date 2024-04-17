const HelloWorld = artifacts.require("HelloWorld");
const LiquidityPool = artifacts.require("LiquidityPool");
const SwapToken = artifacts.require("SwapToken");
const LpToken = artifacts.require("LpToken");

contract("HelloWorld", (accounts) => {
  it("should return 'Hello, World!' after setMessage is called", async () => {
    const instance = await HelloWorld.deployed();
    await instance.setMessage("Hello, World!", { from: accounts[0] });
    const message = await instance.getMessage();
    assert.equal(
      message,
      "Hello, World!",
      "The message was not set correctly."
    );
  });
  it("should return new value after setMessage is called", async () => {
    const instance = await HelloWorld.deployed();
    await instance.setMessage("new value", { from: accounts[0] });
    const message = await instance.getMessage();
    assert.equal(message, "new value", "The message was not set correctly.");
  });
});
