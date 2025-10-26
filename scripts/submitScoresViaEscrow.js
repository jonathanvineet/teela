#!/usr/bin/env node

/**
 * Submit Scores via AgentEscrow Contract
 * 
 * This creates a mock session and distributes payment, which triggers score recording
 * 
 * Usage: node scripts/submitScoresViaEscrow.js
 */

import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

// Contract ABIs
const AGENT_ESCROW_ABI = [
  "function createSession() external payable returns (uint256)",
  "function distributePayment(uint256 sessionId, address[] memory recipients, uint256[] memory amounts, string[] memory agentIds, uint256[] memory scores) external",
  "function sessions(uint256) external view returns (address user, uint256 amount, uint256 startTime, bool completed)",
  "function backend() external view returns (address)",
  "function scoringContract() external view returns (address)",
  "function sessionCounter() external view returns (uint256)",
  "event SessionCreated(uint256 sessionId, address user, uint256 amount)"
];

const AGENT_SCORING_ABI = [
  "function getAgentScore(string memory agentId) external view returns (uint256 totalScore, uint256 sessionCount, uint256 averageScore, uint256 totalRevenue)"
];

// Mock agent data - these will receive scores
const MOCK_AGENTS = [
  { id: 'agent_financial_001', name: 'Financial Expert', score: 85, address: '0xf1A68c0D4c1A8de334240050899324B713Cfc677', amount: '0.0005' },
  { id: 'agent_investment_001', name: 'Investment Advisor', score: 90, address: '0xf1A68c0D4c1A8de334240050899324B713Cfc677', amount: '0.0007' },
  { id: 'agent_tax_001', name: 'Tax Consultant', score: 78, address: '0xf1A68c0D4c1A8de334240050899324B713Cfc677', amount: '0.0003' },
  { id: 'agent_budget_001', name: 'Budget Planner', score: 82, address: '0xf1A68c0D4c1A8de334240050899324B713Cfc677', amount: '0.0004' },
  { id: 'agent_legal_001', name: 'Legal Advisor', score: 88, address: '0xf1A68c0D4c1A8de334240050899324B713Cfc677', amount: '0.0006' }
];

async function main() {
  console.log('\n🚀 Submitting Scores via Escrow Contract...\n');

  // Check environment variables
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || process.env.WEB3_PROVIDER_URL;
  const agentScoringAddress = process.env.AGENT_SCORING_ADDRESS;
  const agentEscrowAddress = process.env.AGENT_ESCROW_ADDRESS;

  if (!privateKey || !rpcUrl || !agentScoringAddress || !agentEscrowAddress) {
    console.error('❌ Error: Missing environment variables');
    console.log('   Required in .env:');
    console.log('   - PRIVATE_KEY');
    console.log('   - RPC_URL or WEB3_PROVIDER_URL');
    console.log('   - AGENT_SCORING_ADDRESS=0xbD3616c1c430054eD01c1E083742ddFD3b7DeA81');
    console.log('   - AGENT_ESCROW_ADDRESS=0x177994988621cF33676CFAE86A9176e553c1D879');
    process.exit(1);
  }

  try {
    // Connect to network
    console.log('📡 Connecting to Sepolia network...');
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
    const escrowContract = new ethers.Contract(agentEscrowAddress, AGENT_ESCROW_ABI, wallet);
    const scoringContract = new ethers.Contract(agentScoringAddress, AGENT_SCORING_ABI, wallet);
    console.log(`   ✅ AgentEscrow: ${agentEscrowAddress}`);
    console.log(`   ✅ AgentScoring: ${agentScoringAddress}\n`);

    // Verify we're the backend
    const backendAddress = await escrowContract.backend();
    console.log('🔍 Verifying permissions...');
    console.log(`   Backend address: ${backendAddress}`);
    console.log(`   Your address: ${address}`);
    
    if (backendAddress.toLowerCase() !== address.toLowerCase()) {
      console.error('\n❌ Error: Your address is not the backend');
      console.log(`   Only the backend can distribute payments`);
      console.log(`   Backend: ${backendAddress}`);
      console.log(`   You: ${address}`);
      process.exit(1);
    }
    console.log(`   ✅ You are the backend!\n`);

    // Calculate total payment needed
    const agentPayments = MOCK_AGENTS.reduce((sum, agent) => {
      return sum + ethers.parseEther(agent.amount);
    }, 0n);
    
    // Platform fee is 5% of total payments
    // Session needs: agentPayments + (agentPayments * 5 / 100)
    const platformFee = (agentPayments * 5n) / 100n;
    const totalPayment = agentPayments + platformFee;
    
    console.log('💰 Creating mock session...');
    console.log(`   Agent payments: ${ethers.formatEther(agentPayments)} ETH`);
    console.log(`   Total with fee: ${ethers.formatEther(totalPayment)} ETH`);
    
    // Create session with payment
    const createTx = await escrowContract.createSession({ value: totalPayment });
    console.log(`   ✅ Transaction sent: ${createTx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);
    
    const createReceipt = await createTx.wait();
    console.log(`   ✅ Confirmed in block ${createReceipt.blockNumber}`);
    
    // Parse logs to get session ID
    let sessionId = null;
    for (const log of createReceipt.logs) {
      try {
        const parsed = escrowContract.interface.parseLog(log);
        if (parsed && parsed.name === 'SessionCreated') {
          sessionId = parsed.args.sessionId;
          break;
        }
      } catch (e) {
        // Not our event, skip
      }
    }
    
    // Fallback: get latest session ID from counter
    if (sessionId === null) {
      const counter = await escrowContract.sessionCounter();
      sessionId = counter - 1n; // Latest session is counter - 1
    }
    
    console.log(`   📋 Session ID: ${sessionId}\n`);

    // Prepare distribution data
    console.log('📊 Preparing score distribution...');
    const recipients = MOCK_AGENTS.map(a => a.address);
    const amounts = MOCK_AGENTS.map(a => ethers.parseEther(a.amount));
    const agentIds = MOCK_AGENTS.map(a => a.id);
    const scores = MOCK_AGENTS.map(a => a.score);

    console.log(`   Agents: ${MOCK_AGENTS.length}`);
    MOCK_AGENTS.forEach(a => {
      console.log(`   • ${a.name}: Score ${a.score}/100, Payment ${a.amount} ETH`);
    });

    // Distribute payment (this will record scores)
    console.log('\n📤 Distributing payment and recording scores...');
    const distributeTx = await escrowContract.distributePayment(
      sessionId,
      recipients,
      amounts,
      agentIds,
      scores
    );
    console.log(`   ✅ Transaction sent: ${distributeTx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);

    const distributeReceipt = await distributeTx.wait();
    console.log(`   ✅ Confirmed in block ${distributeReceipt.blockNumber}`);
    console.log(`   ⛽ Gas used: ${distributeReceipt.gasUsed.toString()}`);
    console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/tx/${distributeTx.hash}`);

    // Verify scores were recorded
    console.log('\n🔍 Verifying recorded scores...');
    for (const agent of MOCK_AGENTS) {
      try {
        const result = await scoringContract.getAgentScore(agent.id);
        console.log(`\n   ${agent.name} (${agent.id}):`);
        console.log(`   • Total Score: ${result.totalScore}`);
        console.log(`   • Sessions: ${result.sessionCount}`);
        console.log(`   • Average: ${result.averageScore}/100`);
        console.log(`   • Revenue: ${ethers.formatEther(result.totalRevenue)} ETH`);
      } catch (error) {
        console.log(`\n   ${agent.name}: Error reading score`);
      }
    }

    console.log('\n✅ Scores submitted successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Wait for Envio to index the events (~30 seconds)');
    console.log('   2. Refresh your Owner Dashboard');
    console.log('   3. Scores will appear on imported agent cards');
    console.log(`   4. View transaction: https://sepolia.etherscan.io/tx/${distributeTx.hash}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.reason) console.error('   Reason:', error.reason);
    if (error.code) console.error('   Code:', error.code);
    process.exit(1);
  }
}

// Run
main().catch(console.error);
