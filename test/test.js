const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("Strip", function () {
  // addresses
  const STETH_CURVE_POOL = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
  const STETH_CONTRACT_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

  // signers
  let signer, tracker, user;
  
  // contracts
  let strip, stEth;

  before(async () => {
    // TODO: set expiry to sensible value once we understand the implications (currently set to 3 months from now)
    const expiry = Date.now() + 7889400000;

    // deploy strip contract

    signer = await ethers.provider.getSigner(0);
    user = await ethers.provider.getSigner(1);
    tracker = await ethers.provider.getSigner(2);

    signerAddr = await signer.getAddress()
    userAddr = await user.getAddress()
    trackerAddr = await tracker.getAddress()

    const Strip = await ethers.getContractFactory("Strip", signer);
    strip = await Strip.deploy(STETH_CONTRACT_ADDRESS, expiry, trackerAddr);
    await strip.deployed();

    console.log('strip deployed to:', strip.address);
    
    // retrieve stEth contract (we may not actually need this to be defined in our test file, but keeping for the moment)
    stEth = await ethers.getContractAt("IERC20", STETH_CONTRACT_ADDRESS, signer);
    console.log('retrieved stEth contract at:', stEth.address);

    // impersonate mainnet account that holds 1 stEth
    
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [STETH_CURVE_POOL]
    });

    curvePool = await ethers.provider.getSigner(STETH_CURVE_POOL);

    await stEth.connect(curvePool).transfer(trackerAddr, ethers.utils.parseEther('1.0'))
    await stEth.connect(curvePool).transfer(userAddr, ethers.utils.parseEther('5.0'))

    const trackerBalance = await stEth.balanceOf(trackerAddr);
    const userBalance = await stEth.balanceOf(userAddr);

    console.log('Tracker Wallet Starting STETH Balance = ', ethers.utils.formatEther(trackerBalance));
    console.log('User Wallet Starting STETH Balance= ', ethers.utils.formatEther(userBalance));
  })

  it("Should be true", async function () {
    assert.equal(true, true);
  });
});
