const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const envPath = path.join(__dirname, "..", ".env.local");
  require("dotenv").config({ path: envPath });

  const signers = await hre.ethers.getSigners();

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

  console.log("\n--- Deploying DEMO RevenueRights ---");
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
    network: "localhost",
    type: "demo",
    chainId: 31337,
  };

  const contractsDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(contractsDir, "DemoContract.json"),
    JSON.stringify(contractData, null, 2)
  );

  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");

    if (env.includes("NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS=")) {
      env = env.replace(/NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS=.*/, `NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS=${address}`);
    } else {
      env += `\nNEXT_PUBLIC_DEMO_CONTRACT_ADDRESS=${address}\n`;
    }

    fs.writeFileSync(envPath, env);
  }

  console.log(`\n  ✓ Demo contract deployed at: ${address}\n`);

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
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
