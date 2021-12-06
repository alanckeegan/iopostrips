const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("Strip", function () {
  const depositorAddr = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
  let strip;

  before(async () => {
    const signer = await ethers.provider.getSigner(0);

    const Strip = await ethers.getContractFactory("Strip", signer);
    strip = await Strip.deploy();
    await strip.deployed();
    console.log('strip deployed to', strip.address);
    
    
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [depositorAddr]
    })

    depositorSigner = await ethers.provider.getSigner(depositorAddr);
  })

  it("Should be true", async function () {
    assert.equal(true, true);
  });
});
