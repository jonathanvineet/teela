#!/usr/bin/env node

import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

const AGENT_SCORING_ABI = [
  "function escrowContract() external view returns (address)",
  "function owner() external view returns (address)"
];

const AGENT_ESCROW_ABI = [
  "function scoringContract() external view returns (address)",
  "function backend() external view returns (address)",
  "function owner() external view returns (address)"
];

async function main() {
  const rpcUrl = process.env.RPC_URL || process.env.WEB3_PROVIDER_URL;
  const agentScoringAddress = process.env.AGENT_SCORING_ADDRESS;
  const agentEscrowAddress = process.env.AGENT_ESCROW_ADDRESS;

  console.log('\n🔍 Checking Contract Setup...\n');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const scoringContract = new ethers.Contract(agentScoringAddress, AGENT_SCORING_ABI, provider);
  const escrowContract = new ethers.Contract(agentEscrowAddress, AGENT_ESCROW_ABI, provider);

  console.log('📝 AgentScoring Contract:');
  console.log(`   Address: ${agentScoringAddress}`);
  const scoringOwner = await scoringContract.owner();
  const escrowFromScoring = await scoringContract.escrowContract();
  console.log(`   Owner: ${scoringOwner}`);
  console.log(`   Escrow: ${escrowFromScoring}`);

  console.log('\n📝 AgentEscrow Contract:');
  console.log(`   Address: ${agentEscrowAddress}`);
  const escrowOwner = await escrowContract.owner();
  const backend = await escrowContract.backend();
  const scoringFromEscrow = await escrowContract.scoringContract();
  console.log(`   Owner: ${escrowOwner}`);
  console.log(`   Backend: ${backend}`);
  console.log(`   Scoring: ${scoringFromEscrow}`);

  console.log('\n🔗 Verification:');
  const escrowMatches = escrowFromScoring.toLowerCase() === agentEscrowAddress.toLowerCase();
  const scoringMatches = scoringFromEscrow.toLowerCase() === agentScoringAddress.toLowerCase();
  
  console.log(`   ✅ Scoring → Escrow: ${escrowMatches ? 'CORRECT' : '❌ MISMATCH'}`);
  console.log(`   ✅ Escrow → Scoring: ${scoringMatches ? 'CORRECT' : '❌ MISMATCH'}`);

  if (!escrowMatches) {
    console.log('\n❌ ERROR: AgentScoring.escrowContract is not set correctly!');
    console.log(`   Expected: ${agentEscrowAddress}`);
    console.log(`   Actual: ${escrowFromScoring}`);
    console.log('\n   Fix: Call AgentScoring.setEscrowContract(${agentEscrowAddress})');
  }

  if (!scoringMatches) {
    console.log('\n❌ ERROR: AgentEscrow.scoringContract is not set correctly!');
    console.log(`   Expected: ${agentScoringAddress}`);
    console.log(`   Actual: ${scoringFromEscrow}`);
  }

  if (escrowMatches && scoringMatches) {
    console.log('\n✅ All contract links are correct!');
  }
}

main().catch(console.error);
