import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const cUSDAddress = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  
  console.log("Deploying SplitGroup...");
  const SplitGroup = await ethers.getContractFactory("SplitGroup");
  const splitGroup = await SplitGroup.deploy(cUSDAddress);

  await splitGroup.waitForDeployment();

  const address = await splitGroup.getAddress();
  console.log(`SplitGroup deployed to: ${address}`);
  console.log(`Verify with: npx hardhat verify --network celo ${address} ${cUSDAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
