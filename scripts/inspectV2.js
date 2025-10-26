#!/usr/bin/env node

import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

async function main() {
  const rpcUrl = process.env.RPC_URL || process.env.WEB3_PROVIDER_URL;
  const scoringAddress = process.env.AGENT_SCORING_ADDRESS;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  console.log('\n🔍 Inspecting AgentScoring V2...\n');
  console.log('Address:', scoringAddress);
  
  // Check if contract exists
  const code = await provider.getCode(scoringAddress);
  console.log('Contract code length:', code.length);
  console.log('Has code:', code !== '0x');
  
  if (code === '0x') {
    console.log('\n❌ ERROR: No contract deployed at this address!');
    process.exit(1);
  }
  
  // Try to call view functions
  const ABI = [
    "function owner() external view returns (address)",
    "function backend() external view returns (address)",
    "function escrowContract() external view returns (address)",
    "function getAgentCount() external view returns (uint256)"
  ];
  
  const contract = new ethers.Contract(scoringAddress, ABI, provider);
  
  try {
    const owner = await contract.owner();
    console.log('\n✅ owner():', owner);
  } catch (e) {
    console.log('\n❌ owner() failed:', e.message);
  }
  
  try {
    const backend = await contract.backend();
    console.log('✅ backend():', backend);
  } catch (e) {
    console.log('❌ backend() failed:', e.message);
  }
  
  try {
    const escrow = await contract.escrowContract();
    console.log('✅ escrowContract():', escrow);
  } catch (e) {
    console.log('❌ escrowContract() failed:', e.message);
  }
  
  try {
    const count = await contract.getAgentCount();
    console.log('✅ getAgentCount():', count.toString());
  } catch (e) {
    console.log('❌ getAgentCount() failed:', e.message);
  }
}

main().catch(console.error);
