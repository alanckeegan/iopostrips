//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// NEED TO MODIFY TO GIVE MINT/BURN PRIVILEGES TO THE STRIP CONTRACT ON DEPLOYMENT
contract IOSTeth is ERC20 {
    constructor(uint256 initialSupply) ERC20("IO-stETH-2023", "IOS") {
      // NEED TO MODIFY TO GIVE MINT/BURN PRIVILEGES TO THE STRIP CONTRACT ON DEPLOYMENT
        _mint(msg.sender, initialSupply);
    }
}