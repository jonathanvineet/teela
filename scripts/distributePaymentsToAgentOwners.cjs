const hre = require("hardhat");
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log('\n💰 Distributing Payments to Agent Owners via Escrow...\n');

  const [signer] = await hre.ethers.getSigners();
  console.log('📡 Connected as:', signer.address);
  
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log('💰 Balance:', hre.ethers.formatEther(balance), 'ETH\n');

  // Read agents from registry
  const registryPath = './agents/agents_registry.json';
  if (!fs.existsSync(registryPath)) {
    console.error('❌ agents_registry.json not found!');
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  let importedAgents = [];
  
  for (const domain in registry.domain) {
    if (registry.domain[domain].agents) {
      importedAgents.push(...registry.domain[domain].agents);
    }
  }

  if (importedAgents.length === 0) {
    console.error('❌ No agents found in registry!');
    process.exit(1);
  }

  console.log(`📋 Found ${importedAgents.length} agents:\n`);
  importedAgents.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.name}`);
    console.log(`      Agent ID: ${a.agent_id}`);
    console.log(`      Owner Wallet: ${a.wallet}`);
    console.log(`      Domain: ${a.domain || 'financial'} • ${a.speciality || 'No speciality'}`);
  });

  // Connect to contracts
  const escrowAddress = process.env.AGENT_ESCROW_ADDRESS;
  const scoringAddress = process.env.AGENT_SCORING_ADDRESS;
  
  const escrowContract = await hre.ethers.getContractAt(
    "contracts/FINAL_AgentEscrow.sol:AgentEscrow",
    escrowAddress
  );

  // Verify we're the backend
  const backend = await escrowContract.backend();
  if (backend.toLowerCase() !== signer.address.toLowerCase()) {
    console.error('\n❌ ERROR: You are not the backend!');
    console.log(`   Backend: ${backend}`);
    console.log(`   You: ${signer.address}`);
    process.exit(1);
  }
  console.log('\n✅ You are the backend!\n');

  // Calculate payments for each agent (mock scores for demo)
  const recipients = importedAgents.map(a => a.wallet);
  const amounts = importedAgents.map((_, i) => hre.ethers.parseEther(`0.000${3 + i}`)); // 0.0003, 0.0004, 0.0005...
  const agentIds = importedAgents.map(a => a.agent_id);
  const scores = importedAgents.map((_, i) => 75 + (i * 5)); // 75, 80, 85...

  // Calculate total payment needed
  const agentPayments = amounts.reduce((sum, amt) => sum + amt, 0n);
  const platformFee = (agentPayments * 5n) / 100n;
  const totalPayment = agentPayments + platformFee;

  console.log('💰 Creating session...');
  console.log(`   Agent payments: ${hre.ethers.formatEther(agentPayments)} ETH`);
  console.log(`   Platform fee (5%): ${hre.ethers.formatEther(platformFee)} ETH`);
  console.log(`   Total: ${hre.ethers.formatEther(totalPayment)} ETH\n`);

  // Create session
  const createTx = await escrowContract.createSession({ value: totalPayment });
  console.log(`   ✅ Transaction sent: ${createTx.hash}`);
  console.log(`   ⏳ Waiting for confirmation...`);
  
  const createReceipt = await createTx.wait();
  console.log(`   ✅ Confirmed in block ${createReceipt.blockNumber}`);

  // Get session ID
  const counter = await escrowContract.sessionCounter();
  const sessionId = counter - 1n;
  console.log(`   📋 Session ID: ${sessionId}\n`);

  // Prepare distribution
  console.log('📊 Distribution details:');
  importedAgents.forEach((a, i) => {
    console.log(`   • ${a.name}: Score ${scores[i]}/100, Payment ${hre.ethers.formatEther(amounts[i])} ETH → ${a.wallet}`);
  });

  // Distribute payments
  console.log('\n📤 Distributing payments to agent owners...');
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

  // Verify payments were sent
  console.log('\n🔍 Verifying payments...');
  for (let i = 0; i < importedAgents.length; i++) {
    const agent = importedAgents[i];
    const balance = await hre.ethers.provider.getBalance(agent.wallet);
    console.log(`   ✅ ${agent.name} (${agent.wallet}): ${hre.ethers.formatEther(balance)} ETH`);
  }

  console.log('\n🎉 PAYMENTS DISTRIBUTED SUCCESSFULLY!');
  console.log('\n💡 Each agent owner received their payment directly to their wallet!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
