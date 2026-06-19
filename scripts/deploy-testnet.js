/**
 * Deploy RevenueSplitter to local Hardhat chain.
 * Future-ready for Base Sepolia deployment (uncomment the testnet section).
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-testnet.js --network localhost
 *   npx hardhat run scripts/deploy-testnet.js --network baseSepolia  (future)
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Deploying RevenueSplitter to ${network}...\n`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`  Deployer: ${deployer.address}`);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:  ${hre.ethers.formatEther(balance)} ETH\n`);

  // Deploy
  const RevenueSplitter = await hre.ethers.getContractFactory("RevenueSplitter");
  const splitter = await RevenueSplitter.deploy();
  await splitter.waitForDeployment();

  const contractAddress = await splitter.getAddress();
  console.log(`  ✓ RevenueSplitter deployed at: ${contractAddress}`);

  // Write contract address and ABI to src/contracts/ for frontend consumption
  const contractDir = path.join(__dirname, '..', 'src', 'contracts');
  if (!fs.existsSync(contractDir)) {
    fs.mkdirSync(contractDir, { recursive: true });
  }

  const artifact = await hre.artifacts.readArtifact("RevenueSplitter");
  const deploymentInfo = {
    address: contractAddress,
    abi: artifact.abi,
    network: network,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    chainId: hre.network.config.chainId || 31337,
  };

  fs.writeFileSync(
    path.join(contractDir, 'RevenueSplitter.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`  ✓ ABI + address written to src/contracts/RevenueSplitter.json`);

  // Update .env.local with the contract address
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=.*/,
        `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=${contractAddress}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`  ✓ Updated .env.local with contract address`);
  }

  // ─── Future: Base Sepolia Verification ────────────────
  // Uncomment when deploying to Base Sepolia testnet:
  //
  // if (network === 'baseSepolia') {
  //   console.log('\n  Waiting 30s for block confirmations before verification...');
  //   await new Promise(r => setTimeout(r, 30000));
  //
  //   try {
  //     await hre.run('verify:verify', {
  //       address: contractAddress,
  //       constructorArguments: [],
  //     });
  //     console.log('  ✓ Contract verified on BaseScan');
  //   } catch (e) {
  //     console.warn('  ⚠ Verification failed:', e.message);
  //   }
  // }

  console.log('\n┌──────────────────────────────────────────────────────────┐');
  console.log('│  LUNIM — Deployment Complete                             │');
  console.log('├──────────────────┬───────────────────────────────────────┤');
  console.log(`│  Network         │  ${network.padEnd(36)}│`);
  console.log(`│  Contract        │  ${contractAddress.padEnd(36)}│`);
  console.log(`│  Deployer        │  ${deployer.address.substring(0, 36).padEnd(36)}│`);
  console.log('└──────────────────┴───────────────────────────────────────┘\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
