import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

async function main() {
    console.log("💰 Checking FTG Contract Balance...\n");

    // Get the provider
    const [deployer] = await ethers.getSigners();
    const provider = deployer.provider;

    try {
        // Check contract ETH balance
        const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
        
        console.log("📊 Contract Information:");
        console.log("   Address:", CONTRACT_ADDRESS);
        console.log("   Network: Coston2 (Flare Testnet)");
        console.log("   Balance:", ethers.formatEther(contractBalance), "ETH");
        console.log("   Balance (Wei):", contractBalance.toString());
        
        // Also check your account balance for comparison
        const accountBalance = await provider.getBalance(deployer.address);
        console.log("\n👤 Your Account:");
        console.log("   Address:", deployer.address);
        console.log("   Balance:", ethers.formatEther(accountBalance), "ETH");
        
        // Connect to contract to get vault info
        const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
        const ftgContract = FTG_TravelVault.attach(CONTRACT_ADDRESS) as any;
        
        console.log("\n🏦 Vault Information:");
        try {
            const vaultId = 1;
            const vaultInfo = await ftgContract.getVaultInfo(vaultId);
            
            console.log("   Vault ID:", vaultId);
            console.log("   Destination:", vaultInfo.destination);
            console.log("   Target Amount:", ethers.formatEther(vaultInfo.targetAmount), "ETH");
            console.log("   Current Amount:", ethers.formatEther(vaultInfo.currentAmount), "ETH");
            console.log("   Progress:", ((Number(vaultInfo.currentAmount) / Number(vaultInfo.targetAmount)) * 100).toFixed(1), "%");
            console.log("   Members:", vaultInfo.memberCount.toString());
            console.log("   Active:", vaultInfo.isActive);
            console.log("   Funds Released:", vaultInfo.fundsReleased);
            
        } catch (e) {
            console.log("   No vaults found or vault info unavailable");
        }
        
        console.log("\n🔗 View on Explorer:");
        console.log("   https://coston2-explorer.flare.network/address/" + CONTRACT_ADDRESS);
        
    } catch (error) {
        console.error("❌ Error checking balance:", error);
    }
}

main()
    .then(() => {
        console.log("\n✅ Balance check completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });