require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
  solidity: "0.8.4",
  networks: {
    forking: {
      url: `${process.env.FORKING_URL}`, // by default forks the latest block
    } 
  }
};