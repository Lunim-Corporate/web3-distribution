const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  console.log("Deployer:", await deployer.getAddress());

  // Send 1 ETH to the contract (does NOT call release)
  await (await deployer.sendTransaction({
    to: address,
    value: hre.ethers.parseEther("1")
  })).wait();

  const bal = await hre.ethers.provider.getBalance(address);
  console.log("Contract balance now:", hre.ethers.formatEther(bal));
}

main().catch(console.error);
