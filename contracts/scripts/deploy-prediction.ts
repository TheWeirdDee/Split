import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const usdmAddress = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  const splitGroupAddress = "0x86A76e4AA9B69cF5C86bFfae69F5744Cc2AED044";

  console.log("Deploying SplitPrediction...");
  const SplitPrediction = await ethers.getContractFactory("SplitPrediction");
  const splitPrediction = await SplitPrediction.deploy(usdmAddress, splitGroupAddress);

  await splitPrediction.waitForDeployment();

  const address = await splitPrediction.getAddress();
  console.log(`SplitPrediction deployed to: ${address}`);
  console.log(`Verify with: npx hardhat verify --network celo ${address} ${usdmAddress} ${splitGroupAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
