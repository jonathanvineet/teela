const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MultiAgentEscrow contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei\n");

  // Set trusted backend address (use deployer for now, update later)
  const trustedBackend = deployer.address;
  console.log("🔐 Trusted backend address:", trustedBackend, "\n");

  // Deploy contract
  const MultiAgentEscrow = await hre.ethers.getContractFactory("MultiAgentEscrow");
  const escrow = await MultiAgentEscrow.deploy(trustedBackend);

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("✅ MultiAgentEscrow deployed to:", address);
  console.log("📋 Platform owner:", await escrow.platformOwner());
  console.log("🔐 Trusted backend:", await escrow.trustedBackend());
  console.log("💵 Platform fee:", await escrow.platformFeePercent(), "%");
  
  console.log("\n📝 Save this for your frontend:");
  console.log("─".repeat(60));
  console.log(`export const MULTI_ESCROW_ADDRESS = "${address}";`);
  console.log("─".repeat(60));
  
  console.log("\n🔗 Verify on Etherscan:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${address} ${trustedBackend}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
