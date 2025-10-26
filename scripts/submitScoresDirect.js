#!/usr/bin/env node

/**
 * Submit Scores DIRECTLY to AgentScoring Contract
 * 
 * This bypasses the escrow and calls recordMultipleScores directly
 * Only works if your wallet IS the escrow contract address
 * 
 * Usage: node scripts/submitScoresDirect.js
 */

import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

const AGENT_SCORING_ABI = [
  "function recordMultipleScores(string[] memory agentIds, uint256[] memory scores, uint256[] memory revenues) external",
  "function getAgentScore(string memory agentId) external view returns (uint256 totalScore, uint256 sessionCount, uint256 averageScore, uint256 totalRevenue)",
  "function escrowContract() external view returns (address)"
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
  console.log('\n🚀 Submitting Scores DIRECTLY to AgentScoring...\n');

  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || process.env.WEB3_PROVIDER_URL;
  const agentScoringAddress = process.env.AGENT_SCORING_ADDRESS;
  const agentEscrowAddress = process.env.AGENT_ESCROW_ADDRESS;

  if (!privateKey || !rpcUrl || !agentScoringAddress || !agentEscrowAddress) {
    console.error('❌ Error: Missing environment variables');
    process.exit(1);
  }

  try {
    // Connect to network
    console.log('📡 Connecting to Sepolia network...');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = await wallet.getAddress();
    console.log(`   ✅ Connected as: ${address}`);

    const balance = await provider.getBalance(address);
    console.log(`   💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

    // Connect to contract
    const scoringContract = new ethers.Contract(agentScoringAddress, AGENT_SCORING_ABI, wallet);
    
    // Check if we're the escrow
    const escrowAddress = await scoringContract.escrowContract();
    console.log('🔍 Verifying permissions...');
    console.log(`   Escrow contract: ${escrowAddress}`);
    console.log(`   Your address: ${address}`);
    console.log(`   Expected escrow: ${agentEscrowAddress}\n`);
    
    if (escrowAddress.toLowerCase() !== agentEscrowAddress.toLowerCase()) {
      console.error('❌ ERROR: Escrow mismatch!');
      console.log(`   Contract expects: ${escrowAddress}`);
      console.log(`   .env has: ${agentEscrowAddress}`);
      process.exit(1);
    }

    if (address.toLowerCase() !== escrowAddress.toLowerCase()) {
      console.error('❌ ERROR: You are not the escrow contract!');
      console.log(`   Only the escrow (${escrowAddress}) can call recordMultipleScores`);
      console.log(`   Your address: ${address}`);
      console.log('\n💡 Solution: Deploy a proxy contract or use the escrow\'s distributePayment');
      process.exit(1);
    }

    // Prepare data
    console.log('📊 Preparing score data...');
    const agentIds = MOCK_AGENTS.map(a => a.id);
    const scores = MOCK_AGENTS.map(a => a.score);
    const revenues = MOCK_AGENTS.map(a => ethers.parseEther(a.revenue));

    console.log(`   Agents: ${MOCK_AGENTS.length}`);
    MOCK_AGENTS.forEach(a => {
      console.log(`   • ${a.name}: Score ${a.score}/100, Revenue ${a.revenue} ETH`);
    });

    // Submit scores
    console.log('\n📤 Submitting scores to blockchain...');
    const tx = await scoringContract.recordMultipleScores(agentIds, scores, revenues, {
      gasLimit: 500000 // Explicit gas limit
    });
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
      console.log(`\n   ${agent.name}:`);
      console.log(`   • Total Score: ${result.totalScore}`);
      console.log(`   • Sessions: ${result.sessionCount}`);
      console.log(`   • Average: ${result.averageScore}/100`);
      console.log(`   • Revenue: ${ethers.formatEther(result.totalRevenue)} ETH`);
    }

    console.log('\n✅ Scores submitted successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.reason) console.error('   Reason:', error.reason);
    if (error.code) console.error('   Code:', error.code);
    process.exit(1);
  }
}

main().catch(console.error);
