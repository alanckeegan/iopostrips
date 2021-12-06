//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Strip {
  uint expiry;
  IERC20 io;
  IERC20 po;
  IERC20 steth;
  mapping (address => IOStakerDeposit) stakerDeposits;

  struct IOStakerDeposit {
    uint amount;
    uint trackerStartingValue;
  }

  constructor(IERC20 _steth, uint _expiry) {
    // CAN CONSTRUCTOR DEPLOY IO AND PO AND SET THEM TO THE IERC20 INTERFACES
    steth = _steth;
    expiry = _expiry;
  }

  // function mint() {
    // recieves steth and mints IOsteth and POsteth to sender

  // }

  // function redeem(){
    // recieves IOstethand POsteth (burns them) and sends steth to sender
  // }

  // function claimPrincipal() {
    // only after expiry
    // recieves POsteth and sends equal amoutn of steth to sender

  // }

  // function stakeIO(){
    // recieves IO and creates a deposit with sender address and amount of steth in tracker at deposit time
    // if there already is a deposit for that address
    // requires claiming yield if they already have a stake to not mess up later claim calculation
  // }
  
  // function claimYield(){
    // calculates steth rewards from current tracker amount vs tracker amount at start
    // sends that steth
    // resets tracker amount on deposit to current steth tracker amount
  // }

  // function unstakeIOAndClaim(){
    // sends IO to user equal to staked amount
    // also claims
    // delete their deposit from mapping
  // }

  // function yieldTrackerBalance(){
    // checks a wallet (hopefully later a vault that can't recieve other steth) for it's steth balance
    // ***when we start the contract, we need to send 1 stETH to this "tracker wallet"
  // }

  // function checkAccruedYield(){
    // calculate accrued yield by looking at yieldTrackerBalance()
    // the % growth in the value of the STETH * the amount of IO deposited is the claimable yield
  // }


}