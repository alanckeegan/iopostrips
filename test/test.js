const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("Strip", function () {
  // addresses
  const STETH_HOLDER_ADDRESS = "0x3b15cec2d922ab0ef74688bcc1056461049f89cb";

  // signers
  let signer, stethHolder;
  
  // contracts
  let strip, stEth;

  before(async () => {
    // deploy strip contract

    signer = await ethers.provider.getSigner(0);
    const Strip = await ethers.getContractFactory("Strip", signer);
    strip = await Strip.deploy();
    await strip.deployed();

    console.log('strip deployed to:', strip.address);
    
    // retrieve stEth contract (we may not need this now, but keeping for reference for time being)

    stEth = await ethers.getContractAt("IERC20", "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", signer);

    console.log('retrieved stEth contract at:', stEth.address);

    // impersonate mainnet account that holds 1 stEth
    
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [STETH_HOLDER_ADDRESS]
    });

    stethHolder = await ethers.provider.getSigner(STETH_HOLDER_ADDRESS);
    
    const stethHolderBalance = await stEth.balanceOf(STETH_HOLDER_ADDRESS);

    console.log('stethHolderBalance', stethHolderBalance);
  })

  it("Should be true", async function () {
    assert.equal(true, true);
  });
});
