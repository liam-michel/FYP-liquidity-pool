const SwapToken = artifacts.require("SwapToken");
const LpToken = artifacts.require("LpToken");
const LiquidityPool = artifacts.require("LiquidityPool");

const initialSupply1 = 0; // Assuming initial supply is a constructor parameter
const name1 = "SwapToken1";
const symbol1 = "SWP1";

const initialSupply2 = 0; // Assuming initial supply is a constructor parameter
const name2 = "SwapToken2";
const symbol2 = "SWP2";

module.exports = async function (callback) {
  const accounts = await web3.eth.getAccounts();
  const swapToken1 = await SwapToken.new(initialSupply1, name1, symbol1);
  const swapToken2 = await SwapToken.new(initialSupply2, name2, symbol2);
  const lptoken = await LpToken.new(0, "LPToken", "LP");
  const liquiditypool = await LiquidityPool.new(
    swapToken1.address,
    swapToken2.address,
    lptoken.address
  );
  await lptoken.transferOwnership(liquiditypool.address);
  const initialAmount = 10000;
  await swapToken1.mint(initialAmount, { from: accounts[0] });
  await swapToken2.mint(initialAmount, { from: accounts[0] });
  await swapToken1.approve(liquiditypool.address, 1000);
  await swapToken2.approve(liquiditypool.address, 500);
  const shares = await liquiditypool.addLiquidity(1000, 50, 0, {
    from: accounts[0],
  });
  console.log("here");
  const newABalance = await swapToken1.balanceOf(accounts[0]);
  const newBBalance = await swapToken2.balanceOf(accounts[0]);
  console.log(newABalance.toString());
  console.log(newBBalance.toString());
  const shareCount = await lptoken.balanceOf(accounts[0]);
  console.log(shareCount.toNumber());
  const noShares = shareCount.toNumber();

  await liquiditypool.removeLiquidity(noShares, { from: accounts[0] });
  const newABalance2 = await swapToken1.balanceOf(accounts[0]);
  const newBBalance2 = await swapToken2.balanceOf(accounts[0]);
  console.log(newABalance2.toNumber(), newBBalance2.toNumber());
  callback();
};
