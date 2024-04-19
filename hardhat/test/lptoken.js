import { assert, expect } from "chai";

const LpTokenFactory = await ethers.getContractFactory("LpToken");

describe("LPToken tests", () => {
  let instance;
  beforeEach(async () => { 
    instance = await LpTokenFactory.deploy(0, "LPToken", "LPT");  
    const [owner] = await ethers.getSigners();  
    await instance.transferOwnership(owner.address);
  })
  it('should transfer ownership to 2nd address signer', async() => { 
    const [owner, addr2] = await ethers.getSigners();
    console.log(owner.address, addr2.address);
    await instance.transferOwnership(addr2.address, {from: owner});

    const contractOwner = await instance.owner();
    console.log(contractOwner, addr2.address);
    assert.equal(contractOwner, addr2.address);

  })
  it('should not error when owner tries to mint tokens', async () => { 
    const [owner] = await ethers.getSigners();
    await instance.mint(owner.address, 100);
    const balance = await instance.balanceOf(owner.address);
    assert.equal(Number(balance),100);
  });
  it('should not error when owner tries to burn tokens', async() => {
    const [owner] = await ethers.getSigners();
    await instance.mint(owner.address, 100);
    const oldBalance = await instance.balanceOf(owner.address);
    await instance.burn(owner.address, 60);
    const newBalance = await instance.balanceOf(owner.address);
    assert.equal(Number(oldBalance),100);
    assert.equal(Number(newBalance), 40);

  })
  it('should error when non-owner attempts to burn LP tokens', async() => {
    const [owner, addr2] = await ethers.getSigners();
    await instance.mint(owner.address, 100);
    try {
      await instance.burn(owner.address, 60, {from: addr2.address});
      assert.fail('transaction did not fail, it should have');
    } catch (error) {
      expect(error.message.includes('revert'), 'expected a revert error');
      }
  })
})