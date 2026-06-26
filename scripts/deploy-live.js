const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const envPath = path.join(__dirname, "..", ".env.local");
  require("dotenv").config({ path: envPath });

  const signers = await hre.ethers.getSigners();

  const adminLiveAddress = process.env.ADMIN_LIVE_ADDRESS || signers[9].address;

  const wallets = [
    signers[0].address,
    signers[1].address,
    signers[2].address,
    signers[3].address,
    signers[4].address,
    signers[5].address,
    signers[6].address,
    signers[7].address,
  ];
  const names = [
    "Aria Voss",
    "Marcus Delgado",
    "Priya Nair",
    "Theo Harrington",
    "Simone Okafor",
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
    "Administrator",
    "Administrator",
    "Administrator",
  ];
  const basisPoints = [2500, 2000, 1500, 1500, 1500, 500, 500, 500];

  console.log("\n--- Deploying LIVE RevenueRights ---");
  console.log("Network:", hre.network.name);
  console.log("Initial holders:");
  names.forEach((n, i) => console.log(`  ${n} - ${basisPoints[i]/100}%`));

  const RevenueRights = await hre.ethers.getContractFactory("RevenueRights");
  const contract = await RevenueRights.deploy(wallets, names, roles, basisPoints);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  const artifact = await hre.artifacts.readArtifact("RevenueRights");
  const contractData = {
    address: address,
    abi: artifact.abi,
    network: hre.network.name,
    type: "live",
    chainId: hre.network.config.chainId || 84532,
  };

  const contractsDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(contractsDir, "LiveContract.json"),
    JSON.stringify(contractData, null, 2)
  );

  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");

    if (env.includes("NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS=")) {
      env = env.replace(/NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS=.*/, `NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS=${address}`);
    } else {
      env += `\nNEXT_PUBLIC_LIVE_CONTRACT_ADDRESS=${address}\n`;
    }

    fs.writeFileSync(envPath, env);
  }

  console.log(`\n  ✓ Live contract deployed at: ${address}\n`);

  const { createClient } = require("@supabase/supabase-js");
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.from('projects').select('id').eq('name', 'Neon Requiem').single();
    if (data && data.id) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({ contract_address: address })
          .eq('id', data.id);
        if (error) throw error;
        console.log("  ✓ Synced contract address to Neon Requiem project in DB.\n");
      } catch (e) {
        console.warn("  ⚠ Could not sync with DB: " + e.message);
      }
    }

    const { data: aether } = await supabase.from('projects').select('id').eq('name', 'Aether Drift').single();
    if (aether && aether.id) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({ contract_address: address })
          .eq('id', aether.id);
        if (error) throw error;
        console.log("  ✓ Synced contract address to Aether Drift project in DB.\n");
      } catch (e) {
        console.warn("  ⚠ Could not sync Aether Drift with DB: " + e.message);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
