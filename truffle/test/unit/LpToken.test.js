const LpToken = artifacts.require("LpToken");

contract("LpToken", (accounts) => {
  let instance;
  beforeEach(async () => {
    const initialSuppy = 0;
    const name = "LPToken";
    const symbol = "LPT";
    instance = await LpToken.new(initialSuppy, name, symbol);
    await instance.transferOwnership(accounts[0], { from: accounts[0] });
  });
  it("should transfer ownership to account 1", async () => {
    await instance.transferOwnership(accounts[1], { from: accounts[0] });
    const owner = await instance.owner();
    assert.equal(owner, accounts[1], "The owner was not set correctly.");
  });

  it("should not error when owner tries to mint tokens", async () => {
    await instance.mint(accounts[0], 100, { from: accounts[0] });
    const balance = await instance.balanceOf(accounts[0]);
    assert.equal(
      balance.toString(),
      "100",
      "The balance was not set correctly."
    );
  });

  it("should not error when owner tries to burn tokens", async () => {
    await instance.mint(accounts[0], 100, { from: accounts[0] });
    const oldBalance = await instance.balanceOf(accounts[0]);
    await instance.burn(accounts[0], 60, { from: accounts[0] });
    const newBalance = await instance.balanceOf(accounts[0]);
    assert.equal(
      oldBalance.toString(),
      "100",
      "The balance was not set correctly"
    );
    assert.equal(
      newBalance.toString(),
      "40",
      "The balance was not set correctly."
    );
  });

  it("should error when non owner tries to mint tokens", async () => {
    try {
      await instance.mint(accounts[0], 100, { from: accounts[1] });
      assert.fail("transaction did not fail, it should have");
    } catch (error) {
      assert(error.message.includes("revert"), "expected a revert error");
    }
  });
});
