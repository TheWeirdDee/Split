import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const cUSDAddress = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  
  console.log("Deploying SavingsCircle...");
  const SavingsCircle = await ethers.getContractFactory("SavingsCircle");
  const savingsCircle = await SavingsCircle.deploy(cUSDAddress);

  await savingsCircle.waitForDeployment();

  const address = await savingsCircle.getAddress();
  console.log(`SavingsCircle deployed to: ${address}`);
  console.log(`Verify with: npx hardhat verify --network celo ${address} ${cUSDAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
