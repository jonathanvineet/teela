const hre = require("hardhat");
require('dotenv').config();

// Agent IDs from the UI screenshot
const VISIBLE_AGENTS = [
  { id: 'agent1qt50', name: 'savings', score: 85, revenue: '0.0005' },
  { id: 'agent1qgv4', name: 'budget', score: 90, revenue: '0.0007' },
  { id: 'agent1q2zx', name: 'debt', score: 88, revenue: '0.0006' }
];

async function main() {
  console.log('\n🚀 Submitting Scores for Visible Agents...\n');

  const [signer] = await hre.ethers.getSigners();
  console.log('📡 Connected as:', signer.address);

  const scoringAddress = process.env.AGENT_SCORING_ADDRESS;
  const scoringContract = await hre.ethers.getContractAt(
    "contracts/AgentScoring_V2.sol:AgentScoring",
    scoringAddress
  );
  
  // Verify we're the backend
  const backend = await scoringContract.backend();
  if (backend.toLowerCase() !== signer.address.toLowerCase()) {
    console.error('\n❌ ERROR: You are not the backend!');
    process.exit(1);
  }
  console.log('✅ You are the backend!\n');

  // Prepare data
  const agentIds = VISIBLE_AGENTS.map(a => a.id);
  const scores = VISIBLE_AGENTS.map(a => a.score);
  const revenues = VISIBLE_AGENTS.map(a => hre.ethers.parseEther(a.revenue));

  console.log('📊 Submitting scores for:');
  VISIBLE_AGENTS.forEach(a => {
    console.log(`   • ${a.name} (${a.id}): Score ${a.score}/100, Revenue ${a.revenue} ETH`);
  });

  // Submit scores
  console.log('\n📤 Submitting to blockchain...');
  const tx = await scoringContract.recordMultipleScores(agentIds, scores, revenues);
  console.log(`   ✅ Transaction sent: ${tx.hash}`);
  console.log(`   ⏳ Waiting for confirmation...`);

  const receipt = await tx.wait();
  console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
  console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);

  // Verify
  console.log('\n🔍 Verifying scores...');
  for (const agent of VISIBLE_AGENTS) {
    const result = await scoringContract.getAgentScore(agent.id);
    console.log(`\n   ✅ ${agent.name} (${agent.id}):`);
    console.log(`   • Total Score: ${result.totalScore}`);
    console.log(`   • Sessions: ${result.sessionCount}`);
    console.log(`   • Average: ${result.averageScore}/100`);
    console.log(`   • Revenue: ${hre.ethers.formatEther(result.totalRevenue)} ETH`);
  }

  console.log('\n🎉 DONE! Refresh your browser to see the scores!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
