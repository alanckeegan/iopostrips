require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

const networks = {};

if(process.env.FORKING_URL) {
  networks.hardhat = {
    chainId: 31337,
    forking: {
      url: process.env.FORKING_URL,
      blockNumber: 13756178
    }
  }
}

module.exports = {
  solidity: "0.8.0",
  networks: {
    ...networks,
  },
};

// console.log('process.env.FORKING_URL', process.env.FORKING_URL)
//  const CHAIN_IDS = {
//     hardhat: 31337, // chain ID for hardhat testing
//   };
  
//   module.exports = {
//     networks: {
//       hardhat: {
//         chainId: CHAIN_IDS.hardhat,
//         forking: {
//           // Using Alchemy
//           url: `${process.env.FORKING_URL}`,
//           // Using Infura
//           // url: `https://mainnet.infura.io/v3/${INFURA_KEY}`, // ${INFURA_KEY} - must be your API key
//           blockNumber: 12821000, // a specific block number with which you want to work
//         },
//       },
//       // you can also add more necessary information to your config
//     },
//     solidity: "0.8.0"
//   }