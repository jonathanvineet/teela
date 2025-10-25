require('@nomicfoundation/hardhat-toolbox')

module.exports = {
  solidity: '0.8.19',
  networks: {
    sepolia: {
      url: process.env.WEB3_PROVIDER_URL || '',
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
}
