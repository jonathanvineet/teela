require('@nomicfoundation/hardhat-toolbox')

module.exports = {
  solidity: '0.8.20',
  networks: {
    sepolia: {
      url: process.env.WEB3_PROVIDER_URL || '',
      chainId: 11155111
    }
  }
}
