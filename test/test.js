const { assert } = require("chai");
const { ethers } = require("hardhat");

// testing reverts in async functions
// there's a pattern used in the tests below where an async function is called in a try block and expected to throw an error (revert)
// the catch block runs in the case of an error and the test then "passes"
// if the catch block is skipped, the test "fails"
// this test should be reliable, but is not the most readable, hence this note
// there may be other ways to test errors in async functions, but this seemed to be a reasonable approach

describe("Strip", function () {
  // addresses
  const STETH_CURVE_POOL = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
  const STETH_CONTRACT_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
  const IO_CONTRACT_ADDRESS = "0xf1823bc4243b40423b8c8c3f6174e687a4c690b8";
  const PO_CONTRACT_ADDRESS = "0x6a1b3c7624b69000d7848916fb4f42026409586c";
  const TIMESTAMP_STARTING_BLOCK = 1618558080

  // signers
  let signer, tracker, user;
  
  // contracts
  let strip, stEth, io, po;

  // due to a rounding issue in the deploystETH contract, a value of 1 is being returned as 0.999999999999999999
  // this function returns the number rounded up to the next whole stETH
  const getRoundedSteth = stethValue => {
    return Math.ceil(Number(ethers.utils.formatEther(stethValue)));
  }

  const mintStEth = async () => {
    await stEth.connect(user).approve(strip.address, ethers.utils.parseEther('1.0'));
    await strip.connect(user).mint(ethers.utils.parseEther('1.0'));
  }

  const redeemStEth = async () => {
    await io.connect(user).approve(strip.address, ethers.utils.parseEther('1.0'));
    await po.connect(user).approve(strip.address, ethers.utils.parseEther('1.0'));
    await strip.connect(user).redeem(ethers.utils.parseEther('1.0'));
  }

  const stakeIo = async () => {
    await io.connect(user).approve(strip.address, ethers.utils.parseEther('1.0'));
    await strip.connect(user).stakeIO(ethers.utils.parseEther('1.0'));
  }

  const checkAccruedYield = async () => {
   const result = (await strip.connect(user).checkAccruedYield(userAddr));
   return result;
  }

  const incrementTracker = async() => {
    await stEth.connect(curvePool).transfer(trackerAddr, ethers.utils.parseEther('.05'))
  }

  const claimYield = async() => {
    await strip.connect(user).claimYield()
  }

  const claimPrincipal = async() => {
    // console.log(await po.balanceOf(user))
    await po.connect(user).approve(strip.address, ethers.utils.parseEther('1.0'))
    await strip.connect(user).claimPrincipal(ethers.utils.parseEther('1.0'))
  }

  before(async () => {
    // TODO: set expiry to sensible value once we understand the implications (currently set to 3 months from now)
    const expiry = TIMESTAMP_STARTING_BLOCK + 7889400000;

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
    stEth = await ethers.getContractAt("ISTETH", STETH_CONTRACT_ADDRESS, signer);
    console.log('retrieved stEth contract at:', stEth.address);

    // impersonate stETH curve pool
    
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
          assert.include(e.message, "revert");
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
        await mintStEth();
        const stripBalance = await stEth.balanceOf(strip.address);

        assert.strictEqual(getRoundedSteth(stripBalance), 1);
      });

      it("should reduce user stETH holdings by 1", async () => {
        const initialHolding = await stEth.balanceOf(userAddr);
        await mintStEth();
        const finalHolding = await stEth.balanceOf(userAddr);
        const holdingDifference = getRoundedSteth(finalHolding) - getRoundedSteth(initialHolding);

        assert.strictEqual(holdingDifference, -1);
      });

      it("should transfer 1 IOSTeth to user", async () => {
        const initialHolding = await io.balanceOf(userAddr);
        await mintStEth();
        const finalHolding = await io.balanceOf(userAddr);
        const holdingDifference = ethers.utils.formatEther(finalHolding) - ethers.utils.formatEther(initialHolding);

        assert.strictEqual(holdingDifference, 1);
      });

      it("should transfer 1 POSTeth to user", async () => {
        const initialHolding = await po.balanceOf(userAddr);
        await mintStEth();
        const finalHolding = await po.balanceOf(userAddr);
        const holdingDifference = ethers.utils.formatEther(finalHolding) - ethers.utils.formatEther(initialHolding);

        assert.strictEqual(holdingDifference, 1);
      });
    });
  });

  describe("redeem()", () => {
    it("should send user stEth", async () => {
      await mintStEth();
      const initialHolding = await stEth.balanceOf(userAddr);
      await redeemStEth();
      const finalHolding = await stEth.balanceOf(userAddr);
      const holdingDifference = getRoundedSteth(finalHolding) - getRoundedSteth(initialHolding);

      assert.strictEqual(holdingDifference, 1);
    });

    it("should reduce user ioSteth", async () => {
      await mintStEth();
      const initialHolding = await io.balanceOf(userAddr);
      await redeemStEth();
      const finalHolding = await io.balanceOf(userAddr);
      const holdingDifference = ethers.utils.formatEther(finalHolding) - ethers.utils.formatEther(initialHolding);

      assert.strictEqual(holdingDifference, -1);
    });

    it("should reduce user poSteth", async () => {
      await mintStEth();
      const initialHolding = await po.balanceOf(userAddr);
      await redeemStEth();
      const finalHolding = await po.balanceOf(userAddr);
      const holdingDifference = ethers.utils.formatEther(finalHolding) - ethers.utils.formatEther(initialHolding);

      assert.strictEqual(holdingDifference, -1);
    });
  });

  describe("stakeIO()", () => {
    it("should initialize staker deposit to 0", async () => {
      const userDeposit = await strip.connect(user).stakerDeposits(userAddr);
      assert.strictEqual(userDeposit.amount, 0);
    });

    it("should stake a deposit", async () => {
      await stakeIo();
      const userDeposit = await strip.connect(user).stakerDeposits(userAddr);
      assert.strictEqual(ethers.utils.formatEther(userDeposit.amount), "1.0");
    });

    it("should revert when attempting to stake a second deposit", async () => {
      try {
        await stakeIo();
      } catch (e) {
        assert.include(e.message, "existing deposit");
        return;
      }
      assert.isOk(false);
    });
  });

  describe("unstakeIOAndClaim()", () => {
    it("should have a staker deposit", async () => {
      const userDeposit = await strip.connect(user).stakerDeposits(userAddr);
      assert.isAbove(userDeposit.amount, 0);
    });

    it("should reset staker deposit to 0 on unstaking", async () => {
      await strip.connect(user).unstakeIOAndClaim();
      const userDeposit = await strip.connect(user).stakerDeposits(userAddr);
      assert.strictEqual(userDeposit.amount, 0);
    });

    it("should revert on attempting to unstake a second time", async () => {
      const userDeposit = await strip.connect(user).stakerDeposits(userAddr);
      assert.strictEqual(userDeposit.amount, 0);
      try {
        await strip.connect(user).unstakeIOAndClaim();
      } catch (e) {
        assert.include(e.message, "no staked IO");
        return;
      }
      assert.isOk(false);
    });
  });

  describe("checkAccruedYield()", () => {
    
    it("Should return zero immediately after deposit", async () => {
      await stakeIo()
      const yield = parseInt(await checkAccruedYield())
      assert.strictEqual(yield, 0);
    });

    it("Should return a positive yield if tracker balance has gone up (.05 stETH)", async () => {
      await incrementTracker()
      const yield = await checkAccruedYield();
      // literally can't figure out why this has to be a string... but i guess it does?
      assert.strictEqual(parseFloat(ethers.utils.formatEther(yield)), 0.05)
    });

  });

  describe("claimYield()", () => {
    
    it("Should should send .05 steth after tracker grows", async () => {
      const preClaimBalance = ethers.utils.formatEther(await stEth.balanceOf(userAddr))
      await claimYield()
      const postClaimBalance = ethers.utils.formatEther(await stEth.balanceOf(userAddr))
      // its, like.......00000000000044 different
      assert(postClaimBalance - preClaimBalance >= 0.05)
    });

    it("Should reset deposit tracker value to current tracker value", async () => {
      const userDeposit = await strip.connect(user).stakerDeposits(userAddr)
      newDepositTrackerValue = userDeposit.trackerStartingValue
      currentTrackerValue = await stEth.balanceOf(trackerAddr)
      assert.strictEqual(currentTrackerValue, newDepositTrackerValue)
    });

    it("Should revert if there is no yield to claim", async () => {
  
      try {
        await claimYield();
      } catch (e) {
        assert.include(e.message, "No yield to claim");
        return;
      }
      assert.isOk(false);
    });





  });

  describe("claimPrincipal()", () => {
    
    it("Should revert before expiry", async () => {
      try {
        await claimPrincipal();
      } catch (e) {
        assert.include(e.message, "No PO redemption before expiry");
        return;
      }
      assert.isOk(false);
    });

    it("Should return 1 steth and take 1 PO after expiry", async () => {
      preClaimBalanceSTETH = getRoundedSteth(await stEth.balanceOf(userAddr))
      preClaimBalancePO = getRoundedSteth(await po.balanceOf(userAddr))
      await network.provider.send("evm_increaseTime", [7889400000])
      await network.provider.send("evm_mine") 
      await claimPrincipal()
      postClaimBalanceSTETH = getRoundedSteth(await stEth.balanceOf(userAddr))
      postClaimBalancePO = getRoundedSteth(await po.balanceOf(userAddr))

      assert.strictEqual(postClaimBalanceSTETH - preClaimBalanceSTETH, 1)
      assert.strictEqual(postClaimBalancePO - preClaimBalancePO, -1)
    });

  });
});
