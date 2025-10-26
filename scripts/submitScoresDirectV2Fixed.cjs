const hre = require("hardhat");
require('dotenv').config();

const MOCK_AGENTS = [
  { id: 'agent_financial_001', name: 'Financial Expert', score: 85, revenue: '0.0005' },
  { id: 'agent_investment_001', name: 'Investment Advisor', score: 90, revenue: '0.0007' },
  { id: 'agent_tax_001', name: 'Tax Consultant', score: 78, revenue: '0.0003' },
  { id: 'agent_budget_001', name: 'Budget Planner', score: 82, revenue: '0.0004' },
  { id: 'agent_legal_001', name: 'Legal Advisor', score: 88, revenue: '0.0006' }
];

async function main() {
  console.log('\n🚀 Submitting Scores DIRECTLY to AgentScoring V2...\n');

  const [signer] = await hre.ethers.getSigners();
  console.log('📡 Connected as:', signer.address);
  
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log('💰 Balance:', hre.ethers.formatEther(balance), 'ETH\n');

  const scoringAddress = process.env.AGENT_SCORING_ADDRESS;
  const scoringContract = await hre.ethers.getContractAt(
    "contracts/AgentScoring_V2.sol:AgentScoring",
    scoringAddress
  );
  
  // Verify we're the backend
  const backend = await scoringContract.backend();
  console.log('🔍 Backend address:', backend);
  console.log('🔍 Your address:', signer.address);
  
  if (backend.toLowerCase() !== signer.address.toLowerCase()) {
    console.error('\n❌ ERROR: You are not the backend!');
    process.exit(1);
  }
  console.log('✅ You are the backend!\n');

  // Prepare data
  console.log('📊 Preparing score data...');
  const agentIds = MOCK_AGENTS.map(a => a.id);
  const scores = MOCK_AGENTS.map(a => a.score);
  const revenues = MOCK_AGENTS.map(a => hre.ethers.parseEther(a.revenue));

  MOCK_AGENTS.forEach(a => {
    console.log(`   • ${a.name}: Score ${a.score}/100, Revenue ${a.revenue} ETH`);
  });

  // Submit scores DIRECTLY
  console.log('\n📤 Submitting scores directly to V2...');
  const tx = await scoringContract.recordMultipleScores(agentIds, scores, revenues);
  console.log(`   ✅ Transaction sent: ${tx.hash}`);
  console.log(`   ⏳ Waiting for confirmation...`);

  const receipt = await tx.wait();
  console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
  console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);

  // Verify scores
  console.log('\n🔍 Verifying recorded scores...');
  for (const agent of MOCK_AGENTS) {
    const result = await scoringContract.getAgentScore(agent.id);
    console.log(`\n   ✅ ${agent.name}:`);
    console.log(`   • Total Score: ${result.totalScore}`);
    console.log(`   • Sessions: ${result.sessionCount}`);
    console.log(`   • Average: ${result.averageScore}/100`);
    console.log(`   • Revenue: ${hre.ethers.formatEther(result.totalRevenue)} ETH`);
  }

  console.log('\n🎉 SCORES RECORDED SUCCESSFULLY!');
  console.log('\n💡 Next steps:');
  console.log('   1. Start Envio: npm run envio:dev');
  console.log('   2. Wait for indexing (~30 seconds)');
  console.log('   3. Check frontend - performance data should appear!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
