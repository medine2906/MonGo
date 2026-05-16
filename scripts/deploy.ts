import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploy ediliyor:", deployer.address);
  console.log("Bakiye:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MON");

  // 1. MonecoToken deploy et
  console.log("\n1. MonecoToken deploy ediliyor...");
  const MonecoToken = await ethers.getContractFactory("MonecoToken");
  const token = await MonecoToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("MonecoToken adresi:", tokenAddress);

  // 2. MonecoProtocol deploy et
  console.log("\n2. MonecoProtocol deploy ediliyor...");
  const MonecoProtocol = await ethers.getContractFactory("MonecoProtocol");
  const protocol = await MonecoProtocol.deploy(tokenAddress, deployer.address);
  await protocol.waitForDeployment();
  const protocolAddress = await protocol.getAddress();
  console.log("MonecoProtocol adresi:", protocolAddress);

  // 3. Protokolü başlangıç token'larıyla fonla (10M $MONECO)
  console.log("\n3. Protokol fonlanıyor...");
  const fundAmount = ethers.parseEther("10000000"); // 10,000,000 MONECO
  await token.approve(protocolAddress, fundAmount);
  await protocol.fundProtocol(fundAmount);
  console.log("Protokol fonlandı:", ethers.formatEther(fundAmount), "MONECO");

  console.log("\n✅ Deploy tamamlandı!");
  console.log("================================");
  console.log("MonecoToken :", tokenAddress);
  console.log("MonecoProtocol:", protocolAddress);
  console.log("================================");
  console.log("\nFrontend .env için:");
  console.log(`VITE_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`VITE_PROTOCOL_ADDRESS=${protocolAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
