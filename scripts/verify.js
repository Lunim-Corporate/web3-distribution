const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const args = process.argv.slice(2);
  const networkName = args[0] || "mumbai";

  console.log(`Verifying contracts on ${networkName}...`);

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const filepath = path.join(deploymentsDir, `deployment-${networkName}-latest.json`);

  if (!fs.existsSync(filepath)) {
    console.error(`Deployment file not found: ${filepath}`);
    console.error("Please deploy contracts first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(filepath, "utf-8"));
  const { ProjectRegistry, RevenueDistributor } = deploymentInfo.contracts;

  console.log("\n1. Verifying ProjectRegistry...");
  try {
    await run("verify:verify", {
      address: ProjectRegistry,
      constructorArguments: [],
    });
    console.log("✅ ProjectRegistry verified");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ ProjectRegistry already verified");
    } else {
      console.error("❌ ProjectRegistry verification failed:", error.message);
    }
  }

  console.log("\n2. Verifying RevenueDistributor...");
  try {
    await run("verify:verify", {
      address: RevenueDistributor,
      constructorArguments: [ProjectRegistry],
    });
    console.log("✅ RevenueDistributor verified");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ RevenueDistributor already verified");
    } else {
      console.error("❌ RevenueDistributor verification failed:", error.message);
    }
  }

  console.log("\n✅ Verification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
