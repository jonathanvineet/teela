const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Integrated Escrow + Scoring System...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei\n");

  // Set trusted backend address (use deployer for now, update later)
  const trustedBackend = deployer.address;
  console.log("🔐 Trusted backend address:", trustedBackend, "\n");

  // Step 1: Deploy AgentScoringSystem first (escrow needs its address)
  console.log("📊 Step 1: Deploying AgentScoringSystem...");
  const AgentScoringSystem = await hre.ethers.getContractFactory("AgentScoringSystem");
  
  // Deploy with placeholder address (will update after escrow is deployed)
  const scoringSystem = await AgentScoringSystem.deploy(deployer.address);
  await scoringSystem.waitForDeployment();
  const scoringAddress = await scoringSystem.getAddress();
  console.log("✅ AgentScoringSystem deployed to:", scoringAddress, "\n");

  // Step 2: Deploy MultiAgentEscrow with scoring contract address
  console.log("💰 Step 2: Deploying MultiAgentEscrow...");
  const MultiAgentEscrow = await hre.ethers.getContractFactory("MultiAgentEscrow");
  const escrow = await MultiAgentEscrow.deploy(trustedBackend, scoringAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ MultiAgentEscrow deployed to:", escrowAddress, "\n");

  // Step 3: Update scoring contract to allow escrow to call it
  console.log("🔗 Step 3: Connecting contracts...");
  const updateTx = await scoringSystem.updateEscrowContract(escrowAddress);
  await updateTx.wait();
  console.log("✅ Scoring contract updated with escrow address\n");

  // Step 4: Fund scoring contract with operational ETH (0.1 ETH for gas)
  console.log("💵 Step 4: Funding scoring contract with operational ETH...");
  const fundAmount = hre.ethers.parseEther("0.1"); // 0.1 ETH for operations
  const fundTx = await deployer.sendTransaction({
    to: scoringAddress,
    value: fundAmount
  });
  await fundTx.wait();
  console.log("✅ Funded scoring contract with 0.1 ETH for operations\n");

  // Display summary
  console.log("=" .repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📋 Contract Addresses:");
  console.log("─".repeat(70));
  console.log("MultiAgentEscrow:     ", escrowAddress);
  console.log("AgentScoringSystem:   ", scoringAddress);
  console.log("─".repeat(70));
  
  console.log("\n📊 Contract Details:");
  console.log("─".repeat(70));
  console.log("Platform owner:       ", await escrow.platformOwner());
  console.log("Trusted backend:      ", await escrow.trustedBackend());
  console.log("Scoring contract:     ", await escrow.scoringContract());
  console.log("Platform fee:         ", await escrow.platformFeePercent(), "%");
  console.log("Scoring operational:  ", hre.ethers.formatEther(await scoringSystem.operationalBalance()), "ETH");
  console.log("─".repeat(70));
  
  console.log("\n📝 Save these for your frontend:");
  console.log("─".repeat(70));
  console.log(`export const MULTI_ESCROW_ADDRESS = "${escrowAddress}";`);
  console.log(`export const SCORING_SYSTEM_ADDRESS = "${scoringAddress}";`);
  console.log("─".repeat(70));
  
  console.log("\n🔗 Verify on Etherscan:");
  console.log("─".repeat(70));
  console.log(`npx hardhat verify --network ${hre.network.name} ${scoringAddress} ${deployer.address}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${escrowAddress} ${trustedBackend} ${scoringAddress}`);
  console.log("─".repeat(70));
  
  console.log("\n💡 Next Steps:");
  console.log("─".repeat(70));
  console.log("1. Update your backend to use these contract addresses");
  console.log("2. When distributing payments, include agentIds and scores");
  console.log("3. Scoring will be automatically triggered after each payment");
  console.log("4. Monitor operational balance in scoring contract");
  console.log("5. Top up scoring contract when operational balance is low");
  console.log("─".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
