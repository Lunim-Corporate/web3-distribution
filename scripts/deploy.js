const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  console.log("\n1. Deploying ProjectRegistry...");
  const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
  const projectRegistry = await ProjectRegistry.deploy();
  await projectRegistry.waitForDeployment();
  const registryAddress = await projectRegistry.getAddress();
  console.log("ProjectRegistry deployed to:", registryAddress);

  console.log("\n2. Deploying RevenueDistributor...");
  const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
  const revenueDistributor = await RevenueDistributor.deploy(registryAddress);
  await revenueDistributor.waitForDeployment();
  const distributorAddress = await revenueDistributor.getAddress();
  console.log("RevenueDistributor deployed to:", distributorAddress);

  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: Number(network.chainId),
    },
    contracts: {
      ProjectRegistry: registryAddress,
      RevenueDistributor: distributorAddress,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `deployment-${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to:", filepath);

  const latestFilepath = path.join(deploymentsDir, `deployment-${network.name}-latest.json`);
  fs.writeFileSync(latestFilepath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Latest deployment info saved to:", latestFilepath);

  console.log("\n✅ Deployment completed successfully!");
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log("ProjectRegistry:", registryAddress);
  console.log("RevenueDistributor:", distributorAddress);
  console.log("\nNext steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Update src/app/lib/contracts.ts with new addresses");
  console.log("3. Test contract interactions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
