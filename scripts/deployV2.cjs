const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("\n🚀 Deploying AgentScoring V2...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");
  
  // Deploy AgentScoring V2
  console.log("📝 Deploying AgentScoring V2...");
  const AgentScoring = await hre.ethers.getContractFactory("contracts/AgentScoring_V2.sol:AgentScoring");
  const scoring = await AgentScoring.deploy();
  await scoring.waitForDeployment();
  
  const scoringAddress = await scoring.getAddress();
  console.log("✅ AgentScoring V2 deployed to:", scoringAddress);
  
  // Set escrow contract
  const escrowAddress = process.env.AGENT_ESCROW_ADDRESS;
  if (escrowAddress) {
    console.log("\n🔗 Setting escrow contract...");
    const tx1 = await scoring.setEscrowContract(escrowAddress);
    await tx1.wait();
    console.log("✅ Escrow set to:", escrowAddress);
  }
  
  // Backend is already set to deployer in constructor
  console.log("✅ Backend set to:", deployer.address);
  
  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📋 Contract Addresses:");
  console.log("──────────────────────────────────────────────────────────────────────");
  console.log("AgentScoring V2:", scoringAddress);
  console.log("AgentEscrow:    ", escrowAddress || "Not set");
  console.log("──────────────────────────────────────────────────────────────────────");
  
  console.log("\n📝 Update your .env file:");
  console.log("──────────────────────────────────────────────────────────────────────");
  console.log(`AGENT_SCORING_ADDRESS=${scoringAddress}`);
  console.log("──────────────────────────────────────────────────────────────────────");
  
  console.log("\n🔗 Next Steps:");
  console.log("──────────────────────────────────────────────────────────────────────");
  console.log("1. Update .env with new AGENT_SCORING_ADDRESS");
  console.log("2. Update escrow contract:");
  console.log(`   escrow.setScoringContract("${scoringAddress}")`);
  console.log("3. Submit scores:");
  console.log("   npm run submit-scores");
  console.log("4. Verify scores:");
  console.log("   node scripts/checkScores.js");
  console.log("5. Update Envio config.yaml with new address");
  console.log("6. Run: npm run envio:dev");
  console.log("──────────────────────────────────────────────────────────────────────");
  
  console.log("\n🔍 Verify on Etherscan:");
  console.log("──────────────────────────────────────────────────────────────────────");
  console.log(`npx hardhat verify --network sepolia ${scoringAddress}`);
  console.log("──────────────────────────────────────────────────────────────────────\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
