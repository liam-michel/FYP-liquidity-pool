import { assert } from "chai";

const swapTokenFactory = await ethers.getContractFactory("SwapToken");  

describe("SwapToken tests", () => { 
  let swapToken1, swapToken2;
  beforeEach(async () => {
    swapToken1 = await swapTokenFactory.deploy(0, "swap1", "swp1");
    swapToken2 =  await swapTokenFactory.deploy(0, "swap2", "swp2");
  })
  it('should mint the appropriate amount of tokens to the user', async ()=> { 
    const [owner] = await ethers.getSigners();
    //mint tokens to owner
    await swapToken1.mint(100);
    await swapToken2.mint(50);

    const balance1 = await swapToken1.balanceOf(owner);
    const balance2 = await swapToken2.balanceOf(owner);
    assert.equal(Number(balance1), 100);  
    assert.equal(Number(balance2), 50);
    })
  it('should transfer the appropriate amount of tokens from one user to another', async () => { 
    const [owner, addr2] = await ethers.getSigners();
    await swapToken1.mint(100);
    
    const signer2 = swapToken2.connect(addr2);
    await signer2.mint(50);
    const ownerAbal = await swapToken1.balanceOf(owner);
    const secondaryBbal = await swapToken2.balanceOf(addr2);

    //send the tokens to each other
    await signer2.transfer(owner.address, 50);
    await swapToken1.transfer(addr2.address, 100);
    const secondaryAbal = await swapToken1.balanceOf(addr2);
    const ownerBbal = await swapToken2.balanceOf(owner);  
    
    assert.equal(ownerAbal, 100);
    assert.equal(secondaryBbal, 50);
    assert.equal(ownerBbal, 50);
    assert.equal(secondaryAbal, 100);


  })
})