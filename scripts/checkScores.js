#!/usr/bin/env node

import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

const AGENT_SCORING_ABI = [
  "function getAgentScore(string memory agentId) external view returns (uint256 totalScore, uint256 sessionCount, uint256 averageScore, uint256 totalRevenue)",
  "function getAllAgents() external view returns (string[] memory)",
  "function getAgentCount() external view returns (uint256)"
];

const MOCK_AGENTS = [
  'agent_financial_001',
  'agent_investment_001',
  'agent_tax_001',
  'agent_budget_001',
  'agent_legal_001'
];

async function main() {
  const rpcUrl = process.env.RPC_URL || process.env.WEB3_PROVIDER_URL;
  const agentScoringAddress = process.env.AGENT_SCORING_ADDRESS;

  console.log('\n🔍 Checking Agent Scores On-Chain...\n');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const scoringContract = new ethers.Contract(agentScoringAddress, AGENT_SCORING_ABI, provider);

  console.log(`📝 AgentScoring: ${agentScoringAddress}\n`);

  // Check total agent count
  const agentCount = await scoringContract.getAgentCount();
  console.log(`📊 Total agents registered: ${agentCount}\n`);

  if (agentCount > 0n) {
    const allAgents = await scoringContract.getAllAgents();
    console.log('Registered agents:', allAgents);
    console.log('');
  }

  // Check our mock agents
  console.log('🔍 Checking mock agent scores:\n');
  
  let hasAnyScores = false;
  for (const agentId of MOCK_AGENTS) {
    try {
      const result = await scoringContract.getAgentScore(agentId);
      const hasScore = result.sessionCount > 0n;
      
      if (hasScore) {
        hasAnyScores = true;
        console.log(`✅ ${agentId}:`);
        console.log(`   Total Score: ${result.totalScore}`);
        console.log(`   Sessions: ${result.sessionCount}`);
        console.log(`   Average: ${result.averageScore}/100`);
        console.log(`   Revenue: ${ethers.formatEther(result.totalRevenue)} ETH\n`);
      } else {
        console.log(`❌ ${agentId}: No scores recorded`);
      }
    } catch (error) {
      console.log(`❌ ${agentId}: Error - ${error.message}`);
    }
  }

  if (!hasAnyScores) {
    console.log('\n⚠️  No scores found for any mock agents!');
    console.log('\nThis means the distributePayment transaction succeeded,');
    console.log('but the recordMultipleScores call failed silently.');
    console.log('\nPossible reasons:');
    console.log('  1. Gas limit too low for the internal call');
    console.log('  2. Array length mismatch');
    console.log('  3. Invalid score values (>100)');
    console.log('  4. Contract state issue');
  }
}

main().catch(console.error);
