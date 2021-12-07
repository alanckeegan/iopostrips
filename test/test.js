const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("Strip", function () {
  // addresses
  const STETH_HOLDER_ADDRESS = "0x3b15cec2d922ab0ef74688bcc1056461049f89cb";
  const STETH_CONTRACT_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

  // signers
  let signer, stethHolder;
  
  // contracts
  let strip, stEth;

  before(async () => {
    // TODO: set expiry to sensible value once we understand the implications (currently set to 3 months from now)
    const expiry = Date.now() + 7889400000;

    // deploy strip contract

    signer = await ethers.provider.getSigner(0);
    const Strip = await ethers.getContractFactory("Strip", signer);
    strip = await Strip.deploy(STETH_CONTRACT_ADDRESS, expiry);
    await strip.deployed();

    console.log('strip deployed to:', strip.address);
    
    // retrieve stEth contract (we may not actually need this to be defined in our test file, but keeping for the moment)
    stEth = await ethers.getContractAt("IERC20", STETH_CONTRACT_ADDRESS, signer);
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
