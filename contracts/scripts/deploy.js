const hre = require("hardhat");

async function main() {
  console.log("Deploying AgentRegistry contract...");

  // Get the ContractFactory and Signers here
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  
  // Deploy the contract
  const agentRegistry = await AgentRegistry.deploy();
  
  await agentRegistry.waitForDeployment();
  
  const contractAddress = await agentRegistry.getAddress();
  
  console.log("AgentRegistry deployed to:", contractAddress);
  
  // Verify the contract on Etherscan (optional)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await agentRegistry.deploymentTransaction().wait(6);
    
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
    } catch (e) {
      console.log("Verification failed:", e.message);
    }
  }
  
  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address
  };
  
  fs.writeFileSync(
    "./deployment-info.json", 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
