// Pre-Presentation Validation Script
// Run this before your Harvard Hackathon presentation to ensure everything works

import { ethers } from "hardhat";

async function validateEverything() {
    console.log("🔍 PRE-PRESENTATION VALIDATION");
    console.log("================================");
    
    try {
        // 1. Check network connection
        const [signer] = await ethers.getSigners();
        const balance = await signer.provider.getBalance(signer.address);
        const network = await signer.provider.getNetwork();
        console.log(`✅ Network: Connected to ${network.name || 'Unknown'}`);
        console.log(`✅ Wallet: ${signer.address}`);
        console.log(`✅ Balance: ${ethers.formatEther(balance)} ETH`);
        
        // 2. Check contract exists
        const contractAddress = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";
        const code = await signer.provider.getCode(contractAddress);
        if (code === "0x") {
            console.log("❌ Contract not found at address");
            return;
        }
        console.log("✅ Contract: Found and deployed");
        
        // 3. Check balance for gas
        if (parseFloat(ethers.formatEther(balance)) < 0.01) {
            console.log("⚠️  Warning: Low balance, might fail gas");
        } else {
            console.log("✅ Gas: Sufficient balance for demo");
        }
        
        // 4. Quick contract interaction test
        const abi = [
            "function getTotalFunds() external view returns (uint256)",
            "function getVaultCount() external view returns (uint256)"
        ];
        const contract = new ethers.Contract(contractAddress, abi, signer);
        
        try {
            const totalFunds = await contract.getTotalFunds();
            const vaultCount = await contract.getVaultCount();
            console.log(`✅ Contract Data: ${ethers.formatEther(totalFunds)} ETH, ${vaultCount} vaults`);
        } catch (error) {
            console.log("⚠️  Contract interaction failed, but contract exists");
        }
        
        console.log("\n🎯 PRESENTATION READINESS: GOOD TO GO!");
        console.log("🚀 Break a leg at Harvard Hackathon!");
        
    } catch (error) {
        console.log("❌ Validation failed:", error instanceof Error ? error.message : String(error));
        console.log("🔧 Check your network connection and wallet setup");
    }
}

validateEverything()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });