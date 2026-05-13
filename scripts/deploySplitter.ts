import hre from "hardhat";

async function main() {
  console.log("Deploying StableFlowSplitter via Ethers...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const Splitter = await hre.ethers.getContractFactory("StableFlowSplitter");
  const splitter = await Splitter.deploy();

  await splitter.waitForDeployment();

  const address = await splitter.getAddress();
  console.log(`StableFlowSplitter deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
