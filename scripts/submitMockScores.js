#!/usr/bin/env node

/**
 * Submit Mock Scores to AgentScoring Contract
 * 
 * Usage: node scripts/submitMockScores.js
 */

import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

// Contract ABIs
const AGENT_SCORING_ABI = [
  "function recordMultipleScores(string[] memory agentIds, uint256[] memory scores, uint256[] memory revenues) external",
  "function getAgentScore(string memory agentId) external view returns (uint256 totalScore, uint256 sessionCount, uint256 averageScore, uint256 totalRevenue)",
  "function escrowContract() external view returns (address)",
  "function owner() external view returns (address)"
];

const AGENT_ESCROW_ABI = [
  "function distributePayment(uint256 sessionId, address[] memory recipients, uint256[] memory amounts, string[] memory agentIds, uint256[] memory scores) external",
  "function scoringContract() external view returns (address)",
  "function backend() external view returns (address)"
];

// Mock agent data
const MOCK_AGENTS = [
  { id: 'agent_financial_001', name: 'Financial Expert', score: 85, revenue: '0.0005' },
  { id: 'agent_investment_001', name: 'Investment Advisor', score: 90, revenue: '0.0007' },
  { id: 'agent_tax_001', name: 'Tax Consultant', score: 78, revenue: '0.0003' },
  { id: 'agent_budget_001', name: 'Budget Planner', score: 82, revenue: '0.0004' },
  { id: 'agent_legal_001', name: 'Legal Advisor', score: 88, revenue: '0.0006' }
];

async function main() {
  console.log('\n🚀 Starting Mock Score Submission...\n');

  // Check environment variables
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || process.env.WEB3_PROVIDER_URL;
  const agentScoringAddress = process.env.AGENT_SCORING_ADDRESS;
  const agentEscrowAddress = process.env.AGENT_ESCROW_ADDRESS;

  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY not found in .env file');
    console.log('   Add: PRIVATE_KEY=0xYourPrivateKey');
    process.exit(1);
  }

  if (!rpcUrl) {
    console.error('❌ Error: RPC_URL not found in .env file');
    console.log('   Add: RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY');
    process.exit(1);
  }

  if (!agentScoringAddress || !agentEscrowAddress) {
    console.error('❌ Error: Contract addresses not found in .env file');
    console.log('   Add: AGENT_SCORING_ADDRESS=0xbD3616c1c430054eD01c1E083742ddFD3b7DeA81');
    console.log('   Add: AGENT_ESCROW_ADDRESS=0x177994988621cF33676CFAE86A9176e553c1D879');
    console.log('\n💡 Using demo mode...\n');
    await demoMode();
    return;
  }

  try {
    // Connect to network
    console.log('📡 Connecting to network...');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = await wallet.getAddress();
    console.log(`   ✅ Connected as: ${address}`);

    // Get balance
    const balance = await provider.getBalance(address);
    console.log(`   💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

    if (balance === 0n) {
      console.error('❌ Error: Wallet has no ETH for gas fees');
      console.log('   Get testnet ETH from: https://sepoliafaucet.com/');
      process.exit(1);
    }

    // Connect to contracts
    console.log('📝 Connecting to contracts...');
    const scoringContract = new ethers.Contract(agentScoringAddress, AGENT_SCORING_ABI, wallet);
    const escrowContract = new ethers.Contract(agentEscrowAddress, AGENT_ESCROW_ABI, wallet);
    console.log(`   ✅ AgentScoring: ${agentScoringAddress}`);
    console.log(`   ✅ AgentEscrow: ${agentEscrowAddress}\n`);

    // Verify setup
    const backendAddress = await escrowContract.backend();
    const scoringFromEscrow = await escrowContract.scoringContract();
    const escrowFromScoring = await scoringContract.escrowContract();
    
    console.log('🔍 Verifying contract setup...');
    console.log(`   Backend address: ${backendAddress}`);
    console.log(`   Your address: ${address}`);
    console.log(`   Escrow → Scoring: ${scoringFromEscrow}`);
    console.log(`   Scoring → Escrow: ${escrowFromScoring}\n`);
    
    if (backendAddress.toLowerCase() !== address.toLowerCase()) {
      console.log(`   ⚠️  Warning: Your address is not the backend`);
      console.log(`   Only the backend can submit scores via escrow`);
      console.log(`   Backend address: ${backendAddress}`);
      console.log(`   Your address: ${address}`);
      console.log('\n   This is a demo - showing what would be submitted:\n');
      await demoMode();
      return;
    }

    // Prepare data
    console.log('📊 Preparing mock score data...');
    const agentIds = MOCK_AGENTS.map(a => a.id);
    const scores = MOCK_AGENTS.map(a => a.score);
    const revenues = MOCK_AGENTS.map(a => ethers.parseEther(a.revenue));

    console.log(`   Agents: ${agentIds.length}`);
    MOCK_AGENTS.forEach(a => {
      console.log(`   • ${a.name}: Score ${a.score}/100, Revenue ${a.revenue} ETH`);
    });

    // Submit directly to scoring contract (since we're the backend/escrow)
    console.log('\n📤 Submitting scores to blockchain...');
    const tx = await scoringContract.recordMultipleScores(agentIds, scores, revenues);
    console.log(`   ✅ Transaction sent: ${tx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);

    const receipt = await tx.wait();
    console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
    console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`   🔗 View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);

    // Verify scores
    console.log('\n🔍 Verifying recorded scores...');
    for (const agent of MOCK_AGENTS) {
      const result = await scoringContract.getAgentScore(agent.id);
      console.log(`\n   ${agent.name}:`);
      console.log(`   • Total Score: ${result.totalScore}`);
      console.log(`   • Sessions: ${result.sessionCount}`);
      console.log(`   • Average: ${result.averageScore}`);
      console.log(`   • Revenue: ${ethers.formatEther(result.totalRevenue)} ETH`);
    }

    console.log('\n✅ Mock scores submitted successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Check your Envio dashboard for indexed events');
    console.log('   2. Refresh Owner Dashboard to see scores');
    console.log('   3. Scores should appear on imported agent cards\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.reason) console.error('   Reason:', error.reason);
    process.exit(1);
  }
}

async function demoMode() {
  console.log('📊 DEMO MODE - Mock Score Data:\n');
  console.log('═'.repeat(70));
  
  MOCK_AGENTS.forEach((agent, idx) => {
    console.log(`\n${idx + 1}. ${agent.name} (${agent.id})`);
    console.log(`   Score: ${agent.score}/100`);
    console.log(`   Revenue: ${agent.revenue} ETH`);
  });
  
  console.log('\n' + '═'.repeat(70));
  console.log('\n📝 This would submit the following transaction:');
  console.log('\nFunction: recordMultipleScores()');
  console.log('Parameters:');
  console.log(`  agentIds: [${MOCK_AGENTS.map(a => `"${a.id}"`).join(', ')}]`);
  console.log(`  scores: [${MOCK_AGENTS.map(a => a.score).join(', ')}]`);
  console.log(`  revenues: [${MOCK_AGENTS.map(a => `"${ethers.parseEther(a.revenue)}"`).join(', ')}]`);
  
  console.log('\n💡 To submit for real:');
  console.log('   1. Add AGENT_SCORING_ADDRESS to .env');
  console.log('   2. Make sure your wallet is the escrow contract');
  console.log('   3. Run this script again\n');
}

// Run
main().catch(console.error);
