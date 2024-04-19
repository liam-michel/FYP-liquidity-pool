import {assert} from 'chai';
describe("Testing hellworld thing", () => {
  it('should return Hello World! when message is fetched', async () => {
    const [owner] = await ethers.getSigners();
    const HelloWorld = await ethers.getContractFactory("helloworld");
    const helloWorld = await HelloWorld.deploy();
    const response = await helloWorld.getMessage();
    assert.equal(response, "Hello World!", "Message not correct")
    })
})