import { ethers } from "hardhat";

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

async function main() {
    console.log("🎮 FTG - Flare Travel Goals Interactive Demo\n");

    // Get signers
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const user1 = signers[1] || deployer; // Use deployer as fallback
    const user2 = signers[2] || deployer; // Use deployer as fallback
    
    console.log("👥 Available accounts:");
    console.log("   Deployer:", deployer.address);
    console.log("   User1:", user1.address);
    console.log("   User2:", user2.address);

    // Connect to deployed contract
    const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
    const ftgContract = FTG_TravelVault.attach(CONTRACT_ADDRESS) as any;

    try {
        console.log("\n🚀 Starting FTG Demo...\n");

        // ============== DEMO 1: Create a Vault ==============
        console.log("📝 Demo 1: Creating a Travel Vault");
        console.log("   Destination: Japan 2025");
        console.log("   Target: 5 ETH");
        console.log("   Deadline: 30 days from now");
        console.log("   Price Trigger: ETH/USD at $4000 (upper bound)");

        const targetAmount = ethers.parseEther("5"); // 5 ETH target
        const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
        const ethUsdFeed = await ftgContract.ETH_USD_FEED();
        const triggerPrice = 400000; // $4000 with 2 decimals (FTSO format)
        const isLowerBound = false; // Trigger when price goes ABOVE $4000

        const createTx = await ftgContract.connect(deployer).createVault(
            "Japan 2025",
            targetAmount,
            deadline,
            ethUsdFeed,
            triggerPrice,
            isLowerBound,
            { value: ethers.parseEther("1") } // Initial 1 ETH contribution
        );
        
        await createTx.wait();
        console.log("✅ Vault created! Initial contribution: 1 ETH");

        // Get vault info
        const vaultId = 1; // First vault
        const vaultInfo = await ftgContract.getVaultInfo(vaultId);
        console.log("📊 Vault Info:");
        console.log("   ID:", vaultId);
        console.log("   Destination:", vaultInfo.destination);
        console.log("   Target:", ethers.formatEther(vaultInfo.targetAmount), "ETH");
        console.log("   Current:", ethers.formatEther(vaultInfo.currentAmount), "ETH");
        console.log("   Members:", vaultInfo.memberCount.toString());

        // ============== DEMO 2: Join Vault ==============
        console.log("\n👥 Demo 2: User1 Joins the Vault");
        
        const joinTx = await ftgContract.connect(user1).joinVault(vaultId, {
            value: ethers.parseEther("2") // Contribute 2 ETH when joining
        });
        await joinTx.wait();
        console.log("✅ User1 joined with 2 ETH contribution");

        // Check updated vault info
        const updatedInfo = await ftgContract.getVaultInfo(vaultId);
        console.log("📊 Updated Vault:");
        console.log("   Current Amount:", ethers.formatEther(updatedInfo.currentAmount), "ETH");
        console.log("   Members:", updatedInfo.memberCount.toString());

        // ============== DEMO 3: Additional Contribution ==============
        console.log("\n💰 Demo 3: User2 Joins and More Contributions");
        
        const joinTx2 = await ftgContract.connect(user2).joinVault(vaultId, {
            value: ethers.parseEther("1.5") // Contribute 1.5 ETH
        });
        await joinTx2.wait();
        console.log("✅ User2 joined with 1.5 ETH contribution");

        // Deployer adds more
        const contributeTx = await ftgContract.connect(deployer).contribute(vaultId, {
            value: ethers.parseEther("0.5") // Add 0.5 ETH more
        });
        await contributeTx.wait();
        console.log("✅ Deployer added 0.5 ETH more");

        // Final vault status
        const finalInfo = await ftgContract.getVaultInfo(vaultId);
        console.log("📊 Final Vault Status:");
        console.log("   Target:", ethers.formatEther(finalInfo.targetAmount), "ETH");
        console.log("   Current:", ethers.formatEther(finalInfo.currentAmount), "ETH");
        console.log("   Progress:", ((Number(finalInfo.currentAmount) / Number(finalInfo.targetAmount)) * 100).toFixed(1), "%");
        console.log("   Members:", finalInfo.memberCount.toString());

        // ============== DEMO 4: Check Price Trigger ==============
        console.log("\n📈 Demo 4: Checking Price Trigger Status");
        
        const priceTriggerInfo = await ftgContract.getPriceTriggerInfo(vaultId);
        console.log("🎯 Price Trigger Settings:");
        console.log("   Feed ID:", priceTriggerInfo.feedId);
        console.log("   Trigger Price: $", (Number(priceTriggerInfo.triggerPrice) / 100).toFixed(2));
        console.log("   Type:", priceTriggerInfo.isLowerBound ? "Lower Bound" : "Upper Bound");
        console.log("   Enabled:", priceTriggerInfo.enabled);

        try {
            const [shouldRelease, currentPrice] = await ftgContract.checkPriceTrigger(vaultId);
            console.log("📊 Current Market Status:");
            console.log("   Current ETH Price: $", (Number(currentPrice) / 100).toFixed(2));
            console.log("   Should Release:", shouldRelease);
            
            if (shouldRelease) {
                console.log("🚨 Price trigger conditions met! Funds can be released.");
            } else {
                console.log("⏳ Waiting for price trigger or group consensus...");
            }
        } catch (error) {
            console.log("⚠️  Could not fetch current price (likely rate limited)");
        }

        // ============== DEMO 5: Group Voting ==============
        console.log("\n🗳️  Demo 5: Group Voting for Fund Release");
        console.log("Since target is reached, let's vote to release funds...");

        // Check if target reached
        if (Number(finalInfo.currentAmount) >= Number(finalInfo.targetAmount)) {
            console.log("🎯 Target amount reached! Starting voting process...");
            
            try {
                const voteTx1 = await ftgContract.connect(deployer).voteToRelease(vaultId);
                await voteTx1.wait();
                console.log("✅ Deployer voted to release");

                const voteTx2 = await ftgContract.connect(user1).voteToRelease(vaultId);
                await voteTx2.wait();
                console.log("✅ User1 voted to release");

                // Check if funds were released
                const postVoteInfo = await ftgContract.getVaultInfo(vaultId);
                if (postVoteInfo.fundsReleased) {
                    console.log("🎉 SUCCESS! Funds have been released to all members!");
                } else {
                    console.log("⏳ More votes needed for consensus...");
                }
            } catch (error) {
                console.log("ℹ️  Voting may have triggered auto-release or other conditions");
            }
        }

        console.log("\n✨ Demo completed! Check the events on the blockchain explorer for full details.");
        console.log("🔗 Contract:", `https://coston2-explorer.flare.network/address/${CONTRACT_ADDRESS}`);

    } catch (error) {
        console.error("❌ Demo failed:", error);
        throw error;
    }
}

// Helper function to get current ETH price from FTSO
async function getCurrentEthPrice(ftgContract: any) {
    try {
        const ethUsdFeed = await ftgContract.ETH_USD_FEED();
        // This would call the FTSO consumer, but might be rate limited in demo
        return null;
    } catch (error) {
        return null;
    }
}

main()
    .then(() => {
        console.log("\n🎉 FTG Demo completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Demo failed:", error);
        process.exit(1);
    });