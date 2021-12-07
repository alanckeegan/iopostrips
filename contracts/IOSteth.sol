//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract IOSTeth is ERC20 {
    constructor(uint256 initialSupply) ERC20("IO-stETH-2023", "IOS") {
        _mint(msg.sender, initialSupply);
    }
}