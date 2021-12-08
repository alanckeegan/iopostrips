const { assert } = require("chai");
const { ethers } = require("hardhat");

// due to a rounding issue in the stETH contract, a value of 1 is being returned as 0.999999999999999999
// this function returns the number rounded up to the next whole stETH
function getRoundedSteth(stethValue) {
  return Math.ceil(Number(ethers.utils.formatEther(stethValue)));
}

describe("Strip", function () {
  // addresses
  const STETH_CURVE_POOL = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
  const STETH_CONTRACT_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
  const IO_CONTRACT_ADDRESS = "0xf1823bc4243b40423b8c8c3f6174e687a4c690b8";
  const PO_CONTRACT_ADDRESS = "0x6a1b3c7624b69000d7848916fb4f42026409586c";

  // signers
  let signer, tracker, user;
  
  // contracts
  let strip, stEth, io, po;

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

    // retrieve IO and PO contracts
    io = await ethers.getContractAt("IERC20", IO_CONTRACT_ADDRESS);
    po = await ethers.getContractAt("IERC20", PO_CONTRACT_ADDRESS);

    console.log('io deployed to:', io.address);
    console.log('po deployed to:', po.address);
    
    // retrieve stEth contract (we may not actually need this to be defined in our test file, but keeping for the moment)
    stEth = await ethers.getContractAt("IERC20", STETH_CONTRACT_ADDRESS, signer);
    console.log('retrieved stEth contract at:', stEth.address);

    // impersonate mainnet account that holds 1 stEth
    
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [STETH_CURVE_POOL]
    });

    curvePool = await ethers.provider.getSigner(STETH_CURVE_POOL);

    await stEth.connect(curvePool).transfer(trackerAddr, ethers.utils.parseEther('1.0'));
    await stEth.connect(curvePool).transfer(userAddr, ethers.utils.parseEther('5.0'));

    const trackerBalance = await stEth.balanceOf(trackerAddr);
    const userBalance = await stEth.balanceOf(userAddr);

    console.log('Tracker Wallet Starting STETH Balance = ', getRoundedSteth(trackerBalance));
    console.log('User Wallet Starting STETH Balance= ', getRoundedSteth(userBalance));

    
  })

  describe("Strip contract instantiation", () => {
    it("should deploy the IO contract with total supply greater than 0", async () => {
      const totalSupply = await io.totalSupply();
      assert.isAbove(totalSupply, 0);
    })

    it("should deploy the PO contract with total supply greater than 0", async () => {
      const totalSupply = await po.totalSupply();
      assert.isAbove(totalSupply, 0);
    })

    it("should have an initial balance of 0 stETH in Strip contract", async () => {
      const stripBalance = await stEth.balanceOf(strip.address);
      assert.strictEqual(stripBalance, 0);
    })
  });

  describe("mint()", () => {
    describe("stETH transfer not approved", () => {
      it("should throw revert error on method call", async () => {
        try {
          await strip.connect(user).mint(1);
        } catch (e) {
          assert.include(e.message, 'revert');
          return;
        }
        assert.isOk(false);
      });

      it("should not transfer 1 stETH to Strip contract", async () => {
        try {
          await strip.connect(user).mint(1);
        } catch (e) { 
          // carry on execution
        }

        const stripBalance = await stEth.balanceOf(strip.address);
        assert.strictEqual(stripBalance, 0);
      });
    });
    describe("stETH transfer approved", () => {
      it("should transfer 1 stETH to Strip contract", async () => {
        await stEth.connect(user).approve(strip.address, ethers.utils.parseEther('1.0'));
        await strip.connect(user).mint(ethers.utils.parseEther('1.0'));
        const stripBalance = await stEth.balanceOf(strip.address);
        assert.strictEqual(getRoundedSteth(stripBalance), 1);
      });

      it("should reduce user stETH holdings by 1", async () => {
        const initialHolding = await stEth.balanceOf(userAddr);
        await stEth.connect(user).approve(strip.address, ethers.utils.parseEther('1.0'));
        await strip.connect(user).mint(ethers.utils.parseEther('1.0'));
        const finalHolding = await stEth.balanceOf(userAddr);
        const holdingDifference = getRoundedSteth(finalHolding) - getRoundedSteth(initialHolding);
        assert.strictEqual(holdingDifference, -1);
      });

      it("should transfer 1 IOSTeth to user", async () => {
        const initialHolding = await io.balanceOf(userAddr);
        await stEth.connect(user).approve(strip.address, ethers.utils.parseEther('1.0'));
        await strip.connect(user).mint(ethers.utils.parseEther('1.0'));
        const finalHolding = await io.balanceOf(userAddr);
        const holdingDifference = ethers.utils.formatEther(finalHolding) - ethers.utils.formatEther(initialHolding);

        assert.strictEqual(holdingDifference, 1);
      });

      it("should transfer 1 POSTeth to user", async () => {
        const initialHolding = await po.balanceOf(userAddr);
        await stEth.connect(user).approve(strip.address, ethers.utils.parseEther('1.0'));
        await strip.connect(user).mint(ethers.utils.parseEther('1.0'));
        const finalHolding = await po.balanceOf(userAddr);
        const holdingDifference = ethers.utils.formatEther(finalHolding) - ethers.utils.formatEther(initialHolding);

        assert.strictEqual(holdingDifference, 1);
      });
    });
  });
});
