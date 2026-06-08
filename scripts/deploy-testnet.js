const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy RevenueRights to Base Sepolia testnet.
 *
 * Prerequisites:
 *   1. Set DEPLOYER_PRIVATE_KEY in .env.local (funded with Base Sepolia ETH)
 *   2. Set NEXT_PUBLIC_BASE_SEPOLIA_RPC (Alchemy RPC URL)
 *   3. (Optional) Set BASESCAN_API_KEY for contract verification
 *
 * Usage:
 *   npx hardhat run scripts/deploy-testnet.js --network base-sepolia
 *
 * Get free Base Sepolia ETH: https://www.alchemy.com/faucets/base-sepolia
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("\n┌──────────────────────────────────────────────────┐");
  console.log("│  LUNIM — Base Sepolia Testnet Deployment          │");
  console.log("├──────────────────────────────────────────────────┤");
  console.log(`│  Deployer:  ${deployer.address}  │`);
  console.log(`│  Balance:   ${hre.ethers.formatEther(balance)} ETH${" ".repeat(Math.max(0, 27 - hre.ethers.formatEther(balance).length))}│`);
  console.log("└──────────────────────────────────────────────────┘\n");

  if (balance === 0n) {
    console.error("❌ Deployer has no ETH. Get free testnet ETH:");
    console.error("   https://www.alchemy.com/faucets/base-sepolia");
    process.exit(1);
  }

  // Use placeholder testnet addresses for rights holders
  // In production, these would be real wallet addresses
  const wallets = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  ];
  const names = [
    "Aria Voss",
    "Marcus Delgado",
    "Priya Nair",
    "Theo Harrington",
    "Simone Okafor",
  ];
  const roles = [
    "Director",
    "Lead Actor",
    "Producer",
    "Music Composer",
    "Screenplay Writer",
  ];
  const basisPoints = [2800, 2200, 1800, 1700, 1500];

  console.log("📦 Deploying RevenueRights with holders:");
  names.forEach((n, i) =>
    console.log(`   ${n} — ${basisPoints[i] / 100}% → ${wallets[i].slice(0, 10)}...`)
  );
  console.log("");

  const RevenueRights = await hre.ethers.getContractFactory("RevenueRights");
  const contract = await RevenueRights.deploy(wallets, names, roles, basisPoints);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`✅ Contract deployed at: ${address}`);

  // Save ABI + address
  const artifact = await hre.artifacts.readArtifact("RevenueRights");
  const contractData = { address, abi: artifact.abi, network: "base-sepolia", chainId: 84532 };

  const contractsDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(contractsDir, "RevenueRights.json"),
    JSON.stringify(contractData, null, 2)
  );

  // Update .env.local
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");
    const replaceOrAppend = (key, value) => {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(env)) {
        env = env.replace(regex, `${key}=${value}`);
      } else {
        env += `\n${key}=${value}\n`;
      }
    };
    replaceOrAppend("NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS", address);
    replaceOrAppend("CONTRACT_ADDRESS", address);
    fs.writeFileSync(envPath, env);
    console.log("📝 Updated .env.local with contract address");
  }

  // Sync to Supabase
  require("dotenv").config({ path: envPath });
  const { createClient } = require("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("name", "Neon Requiem")
      .single();

    if (data?.id) {
      const { error } = await supabase
        .from("projects")
        .update({ contract_address: address })
        .eq("id", data.id);
      if (!error) {
        console.log("🗄️  Synced contract address to Supabase (Neon Requiem)");
      }
    }
  }

  // Attempt verification
  console.log("\n⏳ Waiting 15s for block confirmations before verification...");
  await new Promise((r) => setTimeout(r, 15000));

  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: [wallets, names, roles, basisPoints],
    });
    console.log("✅ Contract verified on BaseScan!");
  } catch (err) {
    if (err.message.includes("Already Verified")) {
      console.log("✅ Contract already verified on BaseScan");
    } else {
      console.warn("⚠️  Verification failed (non-critical):", err.message);
      console.log("   You can verify manually at: https://sepolia.basescan.org/verifyContract");
    }
  }

  console.log("\n┌──────────────────────────────────────────────────┐");
  console.log("│  ✅ DEPLOYMENT COMPLETE                           │");
  console.log("├──────────────────────────────────────────────────┤");
  console.log(`│  Contract:  ${address}  │`);
  console.log(`│  Network:   Base Sepolia (84532)                  │`);
  console.log(`│  Explorer:  https://sepolia.basescan.org/address/${address}  │`);
  console.log("└──────────────────────────────────────────────────┘\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
