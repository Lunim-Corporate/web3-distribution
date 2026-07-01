/**
 * Deploy RevenueRightsUpgradeable with UUPS proxy using @openzeppelin/hardhat-upgrades.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-upgradeable.js --network localhost
 *   npx hardhat run scripts/deploy-upgradeable.js --network base-sepolia
 *   npx hardhat run scripts/deploy-upgradeable.js --network base-mainnet
 *
 * The proxy address is written to .env.local as NEXT_PUBLIC_UPGRADEABLE_CONTRACT_ADDRESS.
 * The implementation address is logged for future upgrade reference.
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  const [deployer] = await hre.ethers.getSigners();

  console.log("\n═══ Deploying RevenueRightsUpgradeable (UUPS) ═══");
  console.log(`  Network:     ${network}`);
  console.log(`  Chain ID:    ${hre.network.config.chainId}`);
  console.log(`  Deployer:    ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:     ${hre.ethers.formatEther(balance)} ETH\n`);

  // ── Holder configuration (matches deploy-live.js: 10 holders, 100%) ──
  const adminLiveAddress = process.env.ADMIN_LIVE_ADDRESS || deployer.address;

  const wallets = [
    deployer.address,
    deployer.address,
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

  // Deploy via UUPS proxy
  const RevenueRightsUpgradeable = await hre.ethers.getContractFactory("RevenueRightsUpgradeable");
  const proxy = await hre.upgrades.deployProxy(
    RevenueRightsUpgradeable,
    [wallets, names, roles, basisPoints],
    { initializer: "initialize", kind: "uups" }
  );
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`\n  ✓ Proxy deployed at:        ${proxyAddress}`);
  console.log(`  ✓ Implementation deployed at: ${implAddress}\n`);

  // Verify initial state
  const holderCount = await proxy.getHolderCount();
  console.log(`  ✓ Holders registered: ${holderCount}`);
  console.log(`  ✓ Owner: ${await proxy.owner()}`);
  console.log(`  ✓ Paused: ${await proxy.paused()}\n`);

  // Write artifact
  const artifact = await hre.artifacts.readArtifact("RevenueRightsUpgradeable");
  const contractData = {
    proxy: proxyAddress,
    implementation: implAddress,
    abi: artifact.abi,
    network,
    kind: "uups",
    chainId: hre.network.config.chainId || 31337,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const contractsDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir, { recursive: true });

  fs.writeFileSync(
    path.join(contractsDir, "RevenueRightsUpgradeable.json"),
    JSON.stringify(contractData, null, 2)
  );
  console.log("  ✓ Artifact written to src/contracts/RevenueRightsUpgradeable.json");

  // Update .env.local
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");

    if (env.includes("NEXT_PUBLIC_UPGRADEABLE_CONTRACT_ADDRESS=")) {
      env = env.replace(
        /NEXT_PUBLIC_UPGRADEABLE_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_UPGRADEABLE_CONTRACT_ADDRESS=${proxyAddress}`
      );
    } else {
      env += `\nNEXT_PUBLIC_UPGRADEABLE_CONTRACT_ADDRESS=${proxyAddress}\n`;
    }

    if (env.includes("NEXT_PUBLIC_UPGRADEABLE_IMPL_ADDRESS=")) {
      env = env.replace(
        /NEXT_PUBLIC_UPGRADEABLE_IMPL_ADDRESS=.*/,
        `NEXT_PUBLIC_UPGRADEABLE_IMPL_ADDRESS=${implAddress}`
      );
    } else {
      env += `\nNEXT_PUBLIC_UPGRADEABLE_IMPL_ADDRESS=${implAddress}\n`;
    }

    fs.writeFileSync(envPath, env);
    console.log("  ✓ Updated .env.local with proxy + implementation addresses");
  }

  // Verify on explorer if not localhost
  if (network !== "localhost") {
    console.log("\n  Waiting 30s for block confirmations before verification...");
    await new Promise((r) => setTimeout(r, 30000));

    try {
      await hre.run("verify:verify", {
        address: proxyAddress,
        constructorArguments: [],
      });
      console.log("  ✓ Contract verified on explorer");
    } catch (e) {
      console.warn("  ⚠ Verification skipped:", e.message);
    }
  }

  // Summary
  console.log("\n┌──────────────────────────────────────────────────────────┐");
  console.log("│  LUNIM — UUPS Upgradeable Deployment Complete            │");
  console.log("├──────────────────┬───────────────────────────────────────┤");
  console.log(`│  Network         │  ${network.padEnd(36)}│`);
  console.log(`│  Proxy           │  ${proxyAddress.padEnd(36)}│`);
  console.log(`│  Implementation  │  ${implAddress.slice(0, 36).padEnd(36)}│`);
  console.log(`│  Deployer        │  ${deployer.address.slice(0, 36).padEnd(36)}│`);
  console.log('└──────────────────┴───────────────────────────────────────┘\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
