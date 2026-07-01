/**
 * Deploy RevenueRights to Base Mainnet.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-mainnet.js --network base-mainnet
 *
 * Prerequisites:
 *   - DEPLOYER_PRIVATE_KEY set in .env.local (wallet with ETH on Base Mainnet)
 *   - BASESCAN_API_KEY set in .env.local (for contract verification)
 *   - The live holder set mirrors deploy-live.js (10 holders, 100%).
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  const [deployer] = await hre.ethers.getSigners();

  console.log("\n═══ Deploying RevenueRights to Base Mainnet ═══");
  console.log(`  Network:     ${network}`);
  console.log(`  Chain ID:    ${hre.network.config.chainId}`);
  console.log(`  Deployer:    ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:     ${hre.ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error("Deployer has 0 ETH — fund the wallet first");
  }

  // ── Live holder configuration (10 holders, sums to 100%) ──────
  const adminLiveAddress = process.env.ADMIN_LIVE_ADDRESS || deployer.address;

  const wallets = [
    deployer.address,
    deployer.address, // These get replaced below
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address,
  ];
  const names = [
    "Aria Voss",
    "Marcus Delgado",
    "Priya Nair",
    "Theo Harrington",
    "Simone Okafor",
    "Zara Vance",
    "Omar Hassan",
    "Pete (Admin)",
    "freewhynane62 (Admin)",
    "jeevesh039 (Admin)",
  ];
  const roles = [
    "Director",
    "Lead Actor",
    "Producer",
    "Music Composer",
    "Screenplay Writer",
    "Marketing",
    "Legal",
    "Administrator",
    "Administrator",
    "Administrator",
  ];
  const basisPoints = [2000, 1700, 1300, 1300, 1200, 500, 500, 500, 500, 500];

  // Deploy
  const RevenueRights = await hre.ethers.getContractFactory("RevenueRights");
  const contract = await RevenueRights.deploy(wallets, names, roles, basisPoints);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`\n  ✓ RevenueRights deployed at: ${address}\n`);

  // Write artifact
  const artifact = await hre.artifacts.readArtifact("RevenueRights");
  const contractData = {
    address,
    abi: artifact.abi,
    network,
    type: "live",
    chainId: hre.network.config.chainId || 8453,
  };

  const contractsDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir, { recursive: true });

  fs.writeFileSync(
    path.join(contractsDir, "MainnetContract.json"),
    JSON.stringify(contractData, null, 2)
  );
  console.log("  ✓ Artifact written to src/contracts/MainnetContract.json");

  // Update .env.local
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");

    if (env.includes("NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS=")) {
      env = env.replace(
        /NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS=${address}`
      );
    } else {
      env += `\nNEXT_PUBLIC_LIVE_CONTRACT_ADDRESS=${address}\n`;
    }

    // Also store mainnet-specific var
    if (env.includes("NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS=")) {
      env = env.replace(
        /NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS=${address}`
      );
    } else {
      env += `\nNEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS=${address}\n`;
    }

    fs.writeFileSync(envPath, env);
    console.log("  ✓ Updated .env.local with contract address");
  }

  // Verify on BaseScan
  console.log("\n  Waiting 30s for block confirmations before verification...");
  await new Promise((r) => setTimeout(r, 30000));

  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: [wallets, names, roles, basisPoints],
    });
    console.log("  ✓ Contract verified on BaseScan");
  } catch (e) {
    console.warn("  ⚠ Verification failed:", e.message);
    console.log("  You can verify manually at https://basescan.org");
  }

  // Summary
  console.log("\n┌──────────────────────────────────────────────────────────┐");
  console.log("│  LUNIM — Mainnet Deployment Complete                     │");
  console.log("├──────────────────┬───────────────────────────────────────┤");
  console.log(`│  Network         │  ${network.padEnd(36)}│`);
  console.log(`│  Contract        │  ${address.padEnd(36)}│`);
  console.log(`│  Deployer        │  ${deployer.address.slice(0, 36).padEnd(36)}│`);
  console.log("└──────────────────┴───────────────────────────────────────┘\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
