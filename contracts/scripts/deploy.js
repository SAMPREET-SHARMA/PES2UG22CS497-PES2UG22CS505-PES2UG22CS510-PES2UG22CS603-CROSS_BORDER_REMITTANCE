const hre = require("hardhat");

async function main() {
  const Contract = await hre.ethers.getContractFactory("CrossBorderRemittance");
  const deployed = await Contract.deploy();
  await deployed.waitForDeployment();  // Changed from deployed.deployed()
  console.log("Contract deployed at:", await deployed.getAddress());  // Changed from deployed.address
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });