const hre = require("hardhat");

async function main() {
  const RevenueSplitter = await hre.ethers.getContractFactory("RevenueSplitter");
  const splitter = await RevenueSplitter.deploy();
  await splitter.waitForDeployment();
  console.log("RevenueSplitter deployed to:", splitter.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
