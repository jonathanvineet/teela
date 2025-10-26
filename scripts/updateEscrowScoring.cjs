const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("\n🔗 Updating Escrow to use AgentScoring V2...\n");
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Updating with account:", signer.address);
  
  const escrowAddress = process.env.AGENT_ESCROW_ADDRESS;
  const scoringV2Address = process.env.AGENT_SCORING_ADDRESS;
  
  console.log("Escrow:", escrowAddress);
  console.log("New Scoring V2:", scoringV2Address);
  
  // Connect to escrow
  const escrow = await hre.ethers.getContractAt(
    "contracts/FINAL_AgentEscrow.sol:AgentEscrow",
    escrowAddress
  );
  
  // Check current scoring address
  const currentScoring = await escrow.scoringContract();
  console.log("\nCurrent scoring contract:", currentScoring);
  
  if (currentScoring.toLowerCase() === scoringV2Address.toLowerCase()) {
    console.log("✅ Already pointing to V2!");
    return;
  }
  
  // Update to V2
  console.log("\n📤 Updating escrow.scoringContract to V2...");
  const tx = await escrow.setScoringContract(scoringV2Address);
  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for confirmation...");
  
  await tx.wait();
  console.log("✅ Updated!");
  
  // Verify
  const newScoring = await escrow.scoringContract();
  console.log("\n🔍 Verification:");
  console.log("New scoring contract:", newScoring);
  console.log(newScoring.toLowerCase() === scoringV2Address.toLowerCase() ? "✅ SUCCESS!" : "❌ FAILED");
  
  console.log("\n💡 Next step: npm run submit-scores");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
