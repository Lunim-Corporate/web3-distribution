const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const c = await hre.ethers.getContractAt("RevenueSplitter", address);

  console.log("Deployer:", await deployer.getAddress());

  // Send 1 ETH to contract
  await (await deployer.sendTransaction({
    to: address,
    value: hre.ethers.parseEther("1")
  })).wait();

  console.log(
    "Contract balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(address))
  );

  // Release funds
  await (await c.release()).wait();

  console.log("Payee 0 balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(await c.payees(0)))
  );

  console.log("Payee 1 balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(await c.payees(1)))
  );
}

main().catch(console.error);
