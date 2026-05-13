import { ethers } from "hardhat";

async function main() {
  console.log("Deploying StableFlowSplitter...");

  const Splitter = await ethers.getContractFactory("StableFlowSplitter");
  const splitter = await Splitter.deploy();

  await splitter.waitForDeployment();

  const address = await splitter.getAddress();
  console.log(`StableFlowSplitter deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
