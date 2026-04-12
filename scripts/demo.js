const hre = require("hardhat");

async function main() {
  const [payer, r1, r2, r3, r4, r5] = await hre.ethers.getSigners();
  const recipients = [r1, r2, r3, r4, r5];

  console.log("Connecting to deployed RevenueRights contract...");
  const artifactPath = require("path").resolve(__dirname, "../src/contracts/RevenueRights.json");
  const contractData = require(artifactPath);
  
  const contract = await hre.ethers.getContractAt("RevenueRights", contractData.address);

  const holders = await contract.getRightsHolders();

  console.log("\n--- BALANCES BEFORE TRANSACTION ---");
  for (let i = 0; i < holders.length; i++) {
    const balanceWei = await hre.ethers.provider.getBalance(holders[i].wallet);
    console.log(`${holders[i].name} (${holders[i].role}): ${hre.ethers.formatEther(balanceWei)} ETH`);
  }

  console.log("\nDistributing 1 ETH from Payer...");
  const amountToDistribute = hre.ethers.parseEther("1.0");
  
  const tx = await contract.connect(payer).distributeRevenue({ value: amountToDistribute });
  console.log(`Transaction sent! Hash: ${tx.hash}`);
  
  console.log("Waiting for confirmation...");
  await tx.wait();
  console.log("Transaction confirmed!\n");

  console.log("--- BALANCES AFTER TRANSACTION ---");
  
  const tableData = [];
  for (let i = 0; i < holders.length; i++) {
    const balanceWei = await hre.ethers.provider.getBalance(holders[i].wallet);
    
    // We assume they all started with ~ 10,000 ETH (or some initial amount)
    // To strictly show amount received, we can just print the balances, or show standard diff
    // For the demo just show current balances and details
    tableData.push({
      Name: holders[i].name,
      Role: holders[i].role,
      Percentage: `${Number(holders[i].percentage) / 100}%`,
      CurrentBalance: `${hre.ethers.formatEther(balanceWei)} ETH`,
      Address: holders[i].wallet.substring(0, 8) + "..."
    });
  }

  console.table(tableData);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
