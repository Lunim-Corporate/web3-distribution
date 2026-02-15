const hre = require("hardhat");

async function main() {
  const payees = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  ];
  const shares = [60, 40]; // must sum to 100

  const RevenueSplitter = await hre.ethers.getContractFactory("RevenueSplitter");
  const contract = await RevenueSplitter.deploy(payees, shares);

  await contract.waitForDeployment();

  console.log("RevenueSplitter deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
