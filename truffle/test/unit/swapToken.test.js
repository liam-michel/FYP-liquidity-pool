const SwapToken = artifacts.require("SwapToken");

contract("SwapToken", (accounts) => {
  let swapToken1, swapToken2; // Declare the variables at the top of the contract scope

  beforeEach(async () => {
    const initialSupply1 = 0; // Assuming initial supply is a constructor parameter
    const name1 = "SwapToken1";
    const symbol1 = "SWP1";

    const initialSupply2 = 0; // Assuming initial supply is a constructor parameter
    const name2 = "SwapToken2";
    const symbol2 = "SWP2";

    // Initialize the variables with new contract instances
    swapToken1 = await SwapToken.new(initialSupply1, name1, symbol1);
    swapToken2 = await SwapToken.new(initialSupply2, name2, symbol2);
  });

  it("should mint the appropriate amount of the tokens to the user", async () => {
    // Now you can use swapToken1 and swapToken2 here
    await swapToken1.mint(100, { from: accounts[0] });
    await swapToken2.mint(50, { from: accounts[0] });

    const balance1 = await swapToken1.balanceOf(accounts[0]);
    const balance2 = await swapToken2.balanceOf(accounts[0]);
    assert.equal(
      balance1.toString(),
      "100",
      "The balance was not set correctly."
    );
    assert.equal(
      balance2.toString(),
      "50",
      "The balance was not set correctly."
    );
  });

  it("should transfer the appropriate amount of tokens from one user to another", async () => {
    await swapToken1.mint(100, { from: accounts[0] });
    await swapToken1.transfer(accounts[1], 10, { from: accounts[0] });
    const account0balance = await swapToken1.balanceOf(accounts[0]);
    const account1balance = await swapToken1.balanceOf(accounts[1]);

    assert.equal(
      account0balance.toString(),
      "90",
      "The balance was not set correctly."
    );
    assert.equal(
      account1balance.toString(),
      "10",
      "The balance was not set correctly."
    );
  });
  // You can add more tests here that use swapToken1 and swapToken2
});
