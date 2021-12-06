const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("Strip", function () {
  const stethAddr = "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0";
  
  let strip;
  let steth;

  before(async () => {
    const signer = await ethers.provider.getSigner(0);

    const Strip = await ethers.getContractFactory("Strip", signer);
    strip = await Strip.deploy();
    await strip.deployed();
    console.log('strip deployed to', strip.address);
    
    steth = await ethers.getContractAt("IERC20", "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0", signer);
    
    console.log('steth address', steth.address);
    
    // Don't think we need this now, but leaving in here for now in case we do

    // await hre.network.provider.request({
    //     method: "hardhat_impersonateAccount",
    //     params: [stethAddr]
    // });


    // stethSigner = await ethers.provider.getSigner(depositorAddr);
  })

  it("Should be true", async function () {
    assert.equal(true, true);
  });
});
