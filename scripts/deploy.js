const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  
  console.log("\n🚀 Deploying RevenueRights contract...");
  console.log("Account:", deployer.address);

  // Prepare deployment arguments
  const wallets = [
    signers[1].address,
    signers[2].address,
    signers[3].address,
    signers[4].address,
    signers[5].address
  ];
  const names = ["Producer Alpha", "Lead Vocalist", "Guitarist", "Drummer", "Manager"];
  const roles = ["Production", "Performer", "Performer", "Performer", "Management"];
  const basisPoints = [4000, 2000, 1500, 1500, 1000]; // Sums to 10000

  const Contract = await hre.ethers.getContractFactory("RevenueRights");
  const contract = await Contract.deploy(wallets, names, roles, basisPoints);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ Contract Deployed to:", contractAddress);

  // Save artifact for frontend
  const artifact = await hre.artifacts.readArtifact("RevenueRights");
  const exportData = {
    address: contractAddress,
    abi: artifact.abi
  };

  const outputDir = path.join(__dirname, "..", "src", "app", "contracts");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "RevenueRights.json"), JSON.stringify(exportData, null, 2));
  console.log("✅ ABI and Address saved to src/app/contracts/RevenueRights.json");

  // SEED SUPABASE via Backend API
  console.log("\n📡 Seeding Supabase database via Backend API...");
  try {
    const projectData = {
      name: "Moonstone — Project Alpha (Live)",
      description: "Primary distribution project for the Moonstone platform.",
      contract_address: contractAddress,
      rightsHolders: wallets.map((w, i) => ({
        name: names[i],
        role: roles[i],
        wallet_address: w,
        percentage: basisPoints[i] / 100
      }))
    };

    const response = await axios.post("http://localhost:4000/api/projects", projectData);
    console.log("✅ Supabase Seeded! Created Project ID:", response.data.id);
  } catch (err) {
    console.error("❌ Failed to seed Supabase. Ensure backend server is running on port 4000.");
    console.error("Error:", err.response?.data || err.message);
  }

  // Summary Table
  console.log("\n====================================================");
  console.log("             DEPLOYMENT SUMMARY                     ");
  console.log("====================================================");
  console.log(`Contract:  ${contractAddress}`);
  console.log(`Deployer:  ${deployer.address}`);
  console.log("----------------------------------------------------");
  console.log("No. | Name             | Role        | Share | Wallet");
  console.log("----------------------------------------------------");
  wallets.forEach((w, i) => {
    console.log(`${i+1}   | ${names[i].padEnd(16)} | ${roles[i].padEnd(11)} | ${basisPoints[i]/100}%  | ${w.substring(0,8)}...`);
  });
  console.log("====================================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
