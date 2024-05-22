import { assert, expect } from "chai";

const LpTokenFactory = await ethers.getContractFactory("LpToken");

describe("LPToken tests", () => {
  let LpTokenFactory, instance;

  before(async () => {
    LpTokenFactory = await ethers.getContractFactory("LpToken");
  });

  beforeEach(async () => {
    instance = await LpTokenFactory.deploy(0, "LPToken", "LPT");
    const [owner] = await ethers.getSigners();
    await instance.transferOwnership(owner.address);
  });

  it("should transfer ownership to 2nd address signer", async () => {
    const [owner, addr2] = await ethers.getSigners();
    await instance.transferOwnership(addr2.address);

    const contractOwner = await instance.owner();
    assert.equal(contractOwner, addr2.address);
  });

  it("should not error when owner tries to mint tokens", async () => {
    const [owner] = await ethers.getSigners();
    await instance.mint(owner.address, BigInt(100));
    const balance = await instance.balanceOf(owner.address);
    assert.equal(balance.toString(), BigInt(100).toString());
  });

  it("should not error when owner tries to burn tokens", async () => {
    const [owner] = await ethers.getSigners();
    await instance.mint(owner.address, BigInt(100));
    const oldBalance = await instance.balanceOf(owner.address);
    await instance.burn(owner.address, BigInt(60));
    const newBalance = await instance.balanceOf(owner.address);
    assert.equal(oldBalance.toString(), BigInt(100).toString());
    assert.equal(newBalance.toString(), BigInt(40).toString());
  });

  it("should error when non-owner attempts to burn LP tokens", async () => {
    const [owner, addr2] = await ethers.getSigners();
    await instance.mint(owner.address, 100);
    try {
      await instance.burn(owner.address, 60, { from: addr2.address });
      assert.fail("transaction did not fail, it should have");
    } catch (error) {
      expect(error.message.includes("revert"), "expected an error");
    }
  });

  it("should not crash when I try to use huge fucking numbers", async () => {
    const [owner, addr2] = await ethers.getSigners();
    const amount = BigInt(1e30);
    await instance.mint(owner.address, amount);
  });
});
