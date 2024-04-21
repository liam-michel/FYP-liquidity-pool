import { assert } from "chai";

const swapTokenFactory = await ethers.getContractFactory("SwapToken");  

describe("SwapToken tests", () => { 
  let swapToken1, swapToken2;
  beforeEach(async () => {
    swapToken1 = await swapTokenFactory.deploy(0, "swap1", "swp1");
    swapToken2 = await swapTokenFactory.deploy(0, "swap2", "swp2");
  })

  it('should mint the appropriate amount of tokens to the user', async ()=> { 
    const [owner] = await ethers.getSigners();
    // Mint tokens to owner
    await swapToken1.mint(100n);
    await swapToken2.mint(50n);

    const balance1 = await swapToken1.balanceOf(owner.address);
    const balance2 = await swapToken2.balanceOf(owner.address);
    assert.equal(balance1, 100n);  
    assert.equal(balance2, 50n);
  })

  it('should transfer the appropriate amount of tokens from one user to another', async () => { 
    const [owner, addr2] = await ethers.getSigners();
    await swapToken1.mint(100n);
    
    const signer2 = swapToken2.connect(addr2);
    await signer2.mint(50n);
    const ownerAbal = await swapToken1.balanceOf(owner.address);
    const secondaryBbal = await swapToken2.balanceOf(addr2.address);

    // Send the tokens to each other
    await signer2.transfer(owner.address, 50n);
    await swapToken1.transfer(addr2.address, 100n);
    const secondaryAbal = await swapToken1.balanceOf(addr2.address);
    const ownerBbal = await swapToken2.balanceOf(owner.address);  
    
    assert.equal(ownerAbal, 100n);
    assert.equal(secondaryBbal, 50n);
    assert.equal(ownerBbal, 50n);
    assert.equal(secondaryAbal, 100n);
  })
})
