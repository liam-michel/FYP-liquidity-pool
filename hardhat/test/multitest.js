import { expect } from "chai";

describe("multitest", () => {
  it('should allow me to instantiate two swapTokens, an LPToken and a liquidity pool', async() => { 
    const [owner] = await ethers.getSigners();
    const SwapTokenFactory = await ethers.getContractFactory("SwapToken");
    const swapToken1 = await SwapTokenFactory.deploy(0, "swap1", "swp1")
    const swapToken2 = await SwapTokenFactory.deploy(0, "swap2", "swp2")

    expect(swapToken1.address != swapToken2.address);
  
  })
})