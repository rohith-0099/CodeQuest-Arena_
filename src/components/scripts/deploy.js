const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying HackathonRegistry contract...");
  
  const HackathonRegistry = await hre.ethers.getContractFactory("HackathonRegistry");
  const hackathonRegistry = await HackathonRegistry.deploy();
  
  await hackathonRegistry.deployed();
  
  console.log("✅ HackathonRegistry deployed to:", hackathonRegistry.address);
  
  // Save contract info for frontend
  const contractsDir = path.join(__dirname, '../src/contracts');
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  const contractInfo = {
    address: hackathonRegistry.address,
    abi: JSON.parse(hackathonRegistry.interface.format('json'))
  };
  
  fs.writeFileSync(
    path.join(contractsDir, 'HackathonRegistry.json'),
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("📄 Contract info saved to src/contracts/HackathonRegistry.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
