const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const envPath = path.join(__dirname, "..", ".env.local");
  require("dotenv").config({ path: envPath });

  const signers = await hre.ethers.getSigners();

  const adminLiveAddress = process.env.ADMIN_LIVE_ADDRESS || signers[9].address;

  const wallets = [
    signers[1].address,
    signers[2].address,
    signers[3].address,
    signers[4].address,
    signers[5].address,
    signers[0].address,
    adminLiveAddress,
    signers[6].address,
    signers[7].address,
    signers[8].address,
  ];
  const names = [
    "Aria Voss",
    "Marcus Delgado",
    "Priya Nair",
    "Theo Harrington",
    "Simone Okafor",
    "Jeevesh (Admin - Local)",
    "Jeevesh (Admin - Live)",
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
    "Administrator",
    "Administrator",
  ];
  const basisPoints = [2000, 1700, 1300, 1300, 1200, 500, 500, 500, 500, 500];

  console.log("Deploying RevenueRights with initial holders:");
  names.forEach((n, i) => console.log(`  ${n} - ${basisPoints[i]/100}%`));

  const RevenueRights = await hre.ethers.getContractFactory("RevenueRights");
  const contract = await RevenueRights.deploy(wallets, names, roles, basisPoints);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  const artifact = await hre.artifacts.readArtifact("RevenueRights");
  const contractData = {
    address: address,
    abi: artifact.abi
  };

  const contractsDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(contractsDir, "RevenueRights.json"),
    JSON.stringify(contractData, null, 2)
  );

  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");
    if (env.includes("NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=")) {
      env = env.replace(/NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=.*/, `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=${address}`);
    } else {
      env += `\nNEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=${address}\n`;
    }

    if (env.includes("CONTRACT_ADDRESS=")) {
      env = env.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${address}`);
    } else {
      env += `\nCONTRACT_ADDRESS=${address}\n`;
    }
    fs.writeFileSync(envPath, env);
  }

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
        console.log("Successfully synced contract address to Neon Requiem project in DB.");
      } catch (e) {
        console.warn("Could not sync with DB: " + e.message);
      }
    }
  }

  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log('│  LUNIM — Contract Deployed                             │');
  console.log('├─────────────────────┬──────────────────────────────────┤');
  console.log(`│  Contract           │  ${address.padEnd(32)} │`);
  console.log('│  Network            │  localhost:8545                  │');
  console.log('│  Chain ID           │  31337                           │');
  console.log('├─────────────────────┴──────────────────────────────────┤');
  console.log('│  HOLDER ACCOUNTS                                       │');
  console.log('├──────────┬──────────┬─────────────────────────────────┤');
  for(let i = 0; i < 10; i++) {
    const namePad = names[i].padEnd(18).substring(0,18);
    const bpLabel = `${(basisPoints[i]/100)}%`.padStart(4);
    const addrPad = wallets[i].substring(0,14) + "..";
    console.log(`│ ${bpLabel}  │ ${namePad}  │ ${addrPad}`);
  }
  console.log('└──────────┴──────────────────┴─────────────────────────┘\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
