const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying FINAL Contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy AgentScoring
  console.log("📊 Step 1: Deploying AgentScoring...");
  const AgentScoring = await hre.ethers.getContractFactory("AgentScoring");
  const scoring = await AgentScoring.deploy();
  await scoring.waitForDeployment();
  const scoringAddress = await scoring.getAddress();
  console.log("✅ AgentScoring deployed to:", scoringAddress, "\n");

  // Deploy AgentEscrow
  console.log("💰 Step 2: Deploying AgentEscrow...");
  const AgentEscrow = await hre.ethers.getContractFactory("AgentEscrow");
  const escrow = await AgentEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ AgentEscrow deployed to:", escrowAddress, "\n");

  // Connect contracts
  console.log("🔗 Step 3: Connecting contracts...");
  
  const tx1 = await scoring.setEscrowContract(escrowAddress);
  await tx1.wait();
  console.log("✅ Scoring contract updated with escrow address");
  
  const tx2 = await escrow.setScoringContract(scoringAddress);
  await tx2.wait();
  console.log("✅ Escrow contract updated with scoring address\n");

  // Display summary
  console.log("=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📋 Contract Addresses:");
  console.log("─".repeat(70));
  console.log("AgentScoring:  ", scoringAddress);
  console.log("AgentEscrow:   ", escrowAddress);
  console.log("─".repeat(70));
  
  console.log("\n📊 Contract Details:");
  console.log("─".repeat(70));
  console.log("Owner:         ", await escrow.owner());
  console.log("Backend:       ", await escrow.backend());
  console.log("Platform Fee:  ", await escrow.platformFee(), "%");
  console.log("─".repeat(70));
  
  console.log("\n📝 Save these for your application:");
  console.log("─".repeat(70));
  console.log(`export const AGENT_SCORING_ADDRESS = "${scoringAddress}";`);
  console.log(`export const AGENT_ESCROW_ADDRESS = "${escrowAddress}";`);
  console.log(`export const NETWORK = "${hre.network.name}";`);
  console.log("─".repeat(70));
  
  console.log("\n🔗 Verify on Etherscan:");
  console.log("─".repeat(70));
  console.log(`npx hardhat verify --network ${hre.network.name} ${scoringAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${escrowAddress}`);
  console.log("─".repeat(70));
  
  console.log("\n✅ Contracts are connected and ready to use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
