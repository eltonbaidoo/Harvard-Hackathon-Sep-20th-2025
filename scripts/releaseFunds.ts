import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

async function main() {
    console.log("🗳️ FTG - Release Funds Demo\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Account:", deployer.address);

    // Connect to contract
    const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
    const ftgContract = FTG_TravelVault.attach(CONTRACT_ADDRESS) as any;

    const vaultId = 1;

    try {
        // Check current vault status
        console.log("📊 Checking current vault status...");
        const vaultInfo = await ftgContract.getVaultInfo(vaultId);
        
        console.log("   Current Amount:", ethers.formatEther(vaultInfo.currentAmount), "ETH");
        console.log("   Target Amount:", ethers.formatEther(vaultInfo.targetAmount), "ETH");
        console.log("   Funds Released:", vaultInfo.fundsReleased);
        console.log("   Active:", vaultInfo.isActive);

        if (vaultInfo.fundsReleased) {
            console.log("\n✅ Funds already released!");
            return;
        }

        if (!vaultInfo.isActive) {
            console.log("\n⚠️ Vault is not active");
            return;
        }

        // Option 1: Vote to release (if you want to release now)
        console.log("\n🗳️ Option 1: Vote to Release Funds");
        console.log("   Since you're the only member, your vote = consensus");
        
        try {
            console.log("   Submitting vote to release...");
            const voteTx = await ftgContract.voteToRelease(vaultId);
            await voteTx.wait();
            console.log("   ✅ Vote submitted!");
            
            // Check if funds were released
            const updatedInfo = await ftgContract.getVaultInfo(vaultId);
            if (updatedInfo.fundsReleased) {
                console.log("   🎉 SUCCESS! Funds have been released to your wallet!");
                
                // Check your new balance
                const newBalance = await deployer.provider.getBalance(deployer.address);
                console.log("   💰 Your new balance:", ethers.formatEther(newBalance), "ETH");
            } else {
                console.log("   ⏳ Vote recorded, may need more conditions...");
            }
            
        } catch (voteError: any) {
            if (voteError.message.includes("Already voted")) {
                console.log("   ℹ️ You already voted. Checking other options...");
            } else {
                console.log("   ⚠️ Vote error:", voteError.message);
            }
        }

        // Option 2: Add more funds to reach target
        console.log("\n💰 Option 2: Add More Funds to Reach Target");
        const needed = Number(vaultInfo.targetAmount) - Number(vaultInfo.currentAmount);
        const neededEth = ethers.formatEther(needed);
        console.log("   Need", neededEth, "more ETH to reach target");
        console.log("   Command: ftgContract.contribute(1, { value: ethers.parseEther(\"" + neededEth + "\") })");

        // Option 3: Check price trigger
        console.log("\n📈 Option 3: Check Price Trigger");
        try {
            const [shouldRelease, currentPrice] = await ftgContract.checkPriceTrigger(vaultId);
            console.log("   Current ETH Price: $" + (Number(currentPrice) / 100).toFixed(2));
            console.log("   Should Release:", shouldRelease);
            
            if (shouldRelease) {
                console.log("   🚨 Price trigger ready! Anyone can call executePriceTrigger()");
                try {
                    const priceTx = await ftgContract.executePriceTrigger(vaultId);
                    await priceTx.wait();
                    console.log("   ✅ Price trigger executed! Funds released!");
                } catch (e) {
                    console.log("   ⚠️ Price trigger execution failed");
                }
            } else {
                const triggerInfo = await ftgContract.getPriceTriggerInfo(vaultId);
                console.log("   Waiting for ETH > $" + (Number(triggerInfo.triggerPrice) / 100).toFixed(2));
            }
        } catch (e) {
            console.log("   ⚠️ Price data unavailable (FTSO rate limited)");
        }

        // Show final status
        console.log("\n📋 Summary:");
        console.log("   Your vault has 3 release mechanisms:");
        console.log("   1. ✅ Group Vote (you can trigger this anytime)");
        console.log("   2. 🎯 Reach 5 ETH target + price trigger");
        console.log("   3. 📈 ETH price hits $4000+ (automatic)");
        console.log("   4. ⏰ Emergency refund after deadline");

    } catch (error: any) {
        console.error("❌ Error:", error.message);
    }
}

main()
    .then(() => {
        console.log("\n🎉 Fund release demo completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });