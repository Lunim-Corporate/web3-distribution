const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // We use Hardhat accounts[1]–[5] for Neon Requiem's 5 holders
  const signers = await hre.ethers.getSigners();
  
  // Neon Requiem seeded holders and percentages:
  // 1. Aria Voss          — 28% (2800 bp)
  // 2. Marcus Delgado     — 22% (2200 bp)
  // 3. Priya Nair         — 18% (1800 bp)
  // 4. Theo Harrington    — 17% (1700 bp)
  // 5. Simone Okafor      — 15% (1500 bp)
  
  const wallets = [
    signers[1].address,
    signers[2].address,
    signers[3].address,
    signers[4].address,
    signers[5].address
  ];
  const names = [
    "Aria Voss",
    "Marcus Delgado",
    "Priya Nair",
    "Theo Harrington",
    "Simone Okafor"
  ];
  const roles = [
    "Director",
    "Lead Actor",
    "Producer",
    "Music Composer",
    "Screenplay Writer"
  ];
  const basisPoints = [2800, 2200, 1800, 1700, 1500];

  console.log("Deploying RevenueRights with initial holders:");
  names.forEach((n, i) => console.log(`  ${n} - ${basisPoints[i]/100}%`));

  const RevenueRights = await hre.ethers.getContractFactory("RevenueRights");
  const contract = await RevenueRights.deploy(wallets, names, roles, basisPoints);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  // Save the address and ABI to src/contracts/RevenueRights.json
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

  // Write address to .env.local
  const envPath = path.join(__dirname, "..", ".env.local");
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

  // Find Neon Requiem project_id via Supabase
  require("dotenv").config({ path: envPath });
  const { createClient } = require("@supabase/supabase-js");
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
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

  console.log('\n┌─────────────────────────────────────────────────────┐');
  console.log('│  LUNIM — Contract Deployed                          │');
  console.log('├──────────────────┬──────────────────────────────────┤');
  console.log(`│  Contract        │  ${address.padEnd(32)} │`);
  console.log('│  Network         │  localhost:8545                  │');
  console.log('│  Chain ID        │  31337                           │');
  console.log('├──────────────────┴──────────────────────────────────┤');
  console.log('│  HOLDER ACCOUNTS (import into MetaMask)             │');
  console.log('├──────────┬────────────────┬────────────────────────┤');
  for(let i=0; i<5; i++) {
    // Note: private keys can be derived or fetched from hardhat, but we can't easily print them without exposing internals or using mnemonic
    // Let's just print the role and address.
    const rolePad = roles[i].padEnd(8).substring(0,8);
    const addrPad = wallets[i].substring(0,14) + "..";
    console.log(`│  ${rolePad}  │  ${addrPad}  │  (Hardhat Account #${i+1})  │`);
  }
  console.log('└──────────┴────────────────┴────────────────────────┘\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
