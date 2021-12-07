require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.FORKING_URL,
        blockNumber: 13756178
      }
    }
  },
};
