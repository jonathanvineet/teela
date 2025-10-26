const hre = require("hardhat");
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log('\n🚀 Submitting Scores for IMPORTED Agents...\n');

  const [signer] = await hre.ethers.getSigners();
  console.log('📡 Connected as:', signer.address);
  
  // Read agents/agents_registry.json to get actual imported agents
  let importedAgents = [];
  try {
    const registryPath = './agents/agents_registry.json';
    if (fs.existsSync(registryPath)) {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      
      // Extract all agents from all domains
      for (const domain in registry.domain) {
        if (registry.domain[domain].agents) {
          importedAgents.push(...registry.domain[domain].agents);
        }
      }
    }
  } catch (err) {
    console.error('Error reading registry:', err.message);
  }

  if (importedAgents.length === 0) {
    console.log('❌ No imported agents found in agents_registry.json');
    console.log('\n💡 Please import some agents first from the Owner Dashboard');
    process.exit(1);
  }

  console.log(`📋 Found ${importedAgents.length} imported agents:\n`);
  importedAgents.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.name || 'Unnamed'}`);
    console.log(`      Agent ID: ${a.agent_id}`);
    console.log(`      Domain: ${a.domain} • ${a.speciality || 'No speciality'}`);
  });

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
  console.log('\n✅ You are the backend!\n');

  // Prepare mock scores for imported agents
  const agentIds = importedAgents.map(a => a.agent_id);
  const scores = importedAgents.map((_, i) => 75 + (i * 5)); // 75, 80, 85, 90, 95...
  const revenues = importedAgents.map((_, i) => hre.ethers.parseEther(`0.000${3 + i}`)); // 0.0003, 0.0004, 0.0005...

  console.log('📊 Preparing score data...');
  importedAgents.forEach((a, i) => {
    console.log(`   • ${a.name}: Score ${scores[i]}/100, Revenue ${hre.ethers.formatEther(revenues[i])} ETH`);
  });

  // Submit scores
  console.log('\n📤 Submitting scores to blockchain...');
  const tx = await scoringContract.recordMultipleScores(agentIds, scores, revenues);
  console.log(`   ✅ Transaction sent: ${tx.hash}`);
  console.log(`   ⏳ Waiting for confirmation...`);

  const receipt = await tx.wait();
  console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
  console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);

  // Verify scores
  console.log('\n🔍 Verifying recorded scores...');
  for (let i = 0; i < importedAgents.length; i++) {
    const agent = importedAgents[i];
    const result = await scoringContract.getAgentScore(agent.agent_id);
    console.log(`\n   ✅ ${agent.name}:`);
    console.log(`   • Total Score: ${result.totalScore}`);
    console.log(`   • Sessions: ${result.sessionCount}`);
    console.log(`   • Average: ${result.averageScore}/100`);
    console.log(`   • Revenue: ${hre.ethers.formatEther(result.totalRevenue)} ETH`);
  }

  console.log('\n🎉 SCORES RECORDED SUCCESSFULLY!');
  console.log('\n💡 Refresh your Owner Dashboard to see the performance data!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
