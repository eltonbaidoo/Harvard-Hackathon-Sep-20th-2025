import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

async function main() {
    console.log("💸 FTG - Complete Fund Withdrawal Guide\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Account:", deployer.address);

    // Connect to contract
    const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
    const ftgContract = FTG_TravelVault.attach(CONTRACT_ADDRESS) as any;

    // Check current contract balance
    const contractBalance = await deployer.provider.getBalance(CONTRACT_ADDRESS);
    console.log("💰 Contract Balance:", ethers.formatEther(contractBalance), "ETH");
    
    if (contractBalance == 0n) {
        console.log("✅ Contract is empty - all funds already withdrawn!");
        console.log("\nTo test withdrawal methods, create a new vault first:");
        console.log("   npx hardhat run scripts/FTG_hackathon_demo.ts --network coston2");
        return;
    }

    console.log("\n" + "=".repeat(60));
    console.log("🔓 Fund Withdrawal Methods Available:");
    console.log("=".repeat(60));

    const vaultId = 1; // Assuming vault 1 exists

    try {
        const vaultInfo = await ftgContract.getVaultInfo(vaultId);
        
        console.log("📊 Current Vault Status:");
        console.log("   Vault ID:", vaultId);
        console.log("   Current Amount:", ethers.formatEther(vaultInfo.currentAmount), "ETH");
        console.log("   Target Amount:", ethers.formatEther(vaultInfo.targetAmount), "ETH");
        console.log("   Members:", vaultInfo.memberCount.toString());
        console.log("   Active:", vaultInfo.isActive);
        console.log("   Funds Released:", vaultInfo.fundsReleased);

        if (vaultInfo.fundsReleased) {
            console.log("\n✅ Funds already released from this vault!");
            return;
        }

        // METHOD 1: Group Voting (Democratic Withdrawal)
        console.log("\n" + "-".repeat(50));
        console.log("🗳️ METHOD 1: Group Voting Withdrawal");
        console.log("-".repeat(50));
        console.log("Best for: When group agrees it's time to book/withdraw");
        console.log("Requirement: 75% of members must vote");
        console.log("Your situation: You're the only member, so your vote = instant release");
        
        console.log("\nCode to execute:");
        console.log("   await ftgContract.voteToRelease(" + vaultId + ");");
        
        try {
            console.log("\n🔄 Executing group vote withdrawal...");
            const voteTx = await ftgContract.voteToRelease(vaultId);
            console.log("   Transaction sent, waiting for confirmation...");
            await voteTx.wait();
            console.log("   ✅ SUCCESS! Funds released via group vote!");
            
            // Check new balances
            const newContractBalance = await deployer.provider.getBalance(CONTRACT_ADDRESS);
            const yourBalance = await deployer.provider.getBalance(deployer.address);
            console.log("   💰 Contract Balance Now:", ethers.formatEther(newContractBalance), "ETH");
            console.log("   💰 Your Balance Now:", ethers.formatEther(yourBalance), "ETH");
            
        } catch (voteError: any) {
            if (voteError.message.includes("Already voted")) {
                console.log("   ⚠️ You already voted. Trying other methods...");
            } else {
                console.log("   ❌ Vote failed:", voteError.message);
            }
        }

        // METHOD 2: Price Trigger Withdrawal
        console.log("\n" + "-".repeat(50));
        console.log("📈 METHOD 2: Price Trigger Withdrawal");
        console.log("-".repeat(50));
        console.log("Best for: Market-based optimal timing");
        console.log("Requirement: ETH/USD price meets trigger condition");

        try {
            const priceTriggerInfo = await ftgContract.getPriceTriggerInfo(vaultId);
            console.log("Current trigger: ETH/USD > $" + (Number(priceTriggerInfo.triggerPrice) / 100).toFixed(2));
            
            const [shouldRelease, currentPrice] = await ftgContract.checkPriceTrigger(vaultId);
            console.log("Current ETH Price: $" + (Number(currentPrice) / 100).toFixed(2));
            console.log("Trigger Ready:", shouldRelease ? "YES! 🚨" : "NO");
            
            if (shouldRelease) {
                console.log("\nCode to execute:");
                console.log("   await ftgContract.executePriceTrigger(" + vaultId + ");");
                console.log("   (Anyone can call this when conditions are met)");
                
                try {
                    console.log("\n🔄 Executing price trigger withdrawal...");
                    const priceTx = await ftgContract.executePriceTrigger(vaultId);
                    await priceTx.wait();
                    console.log("   ✅ SUCCESS! Funds released via price trigger!");
                } catch (e) {
                    console.log("   ⚠️ Price trigger execution failed");
                }
            } else {
                console.log("   ⏳ Waiting for ETH price to reach trigger level");
            }
            
        } catch (e) {
            console.log("   ⚠️ Price data unavailable (FTSO rate limited)");
        }

        // METHOD 3: Reach Target + Auto Release
        console.log("\n" + "-".repeat(50));
        console.log("🎯 METHOD 3: Target Achievement Withdrawal");
        console.log("-".repeat(50));
        console.log("Best for: When savings goal is reached");
        console.log("Requirement: Contribute enough to reach target amount");
        
        const needed = Number(vaultInfo.targetAmount) - Number(vaultInfo.currentAmount);
        if (needed > 0) {
            const neededEth = ethers.formatEther(needed);
            console.log("Need " + neededEth + " more ETH to reach target");
            console.log("\nCode to execute:");
            console.log("   await ftgContract.contribute(" + vaultId + ", {");
            console.log("       value: ethers.parseEther(\"" + neededEth + "\")");
            console.log("   });");
            console.log("   (Auto-releases if price trigger is also met)");
        } else {
            console.log("✅ Target already reached!");
        }

        // METHOD 4: Emergency Refund
        console.log("\n" + "-".repeat(50));
        console.log("⚠️ METHOD 4: Emergency Refund");
        console.log("-".repeat(50));
        console.log("Best for: Safety net if other methods fail");
        console.log("Requirement: Vault deadline must have passed");
        
        const currentTime = Math.floor(Date.now() / 1000);
        const deadline = Number(vaultInfo.deadline);
        const timeLeft = deadline - currentTime;
        
        if (timeLeft > 0) {
            const daysLeft = Math.floor(timeLeft / (24 * 60 * 60));
            console.log("Time until emergency refund available: " + daysLeft + " days");
            console.log("Emergency refund will be available after: " + new Date(deadline * 1000).toLocaleString());
        } else {
            console.log("✅ Emergency refund available now!");
            console.log("\nCode to execute:");
            console.log("   await ftgContract.emergencyRefund(" + vaultId + ");");
        }

        // SUMMARY
        console.log("\n" + "=".repeat(60));
        console.log("📋 WITHDRAWAL SUMMARY");
        console.log("=".repeat(60));
        console.log("Available methods to get your ETH back:");
        console.log("1. 🗳️  Group Vote (immediate - you control this)");
        console.log("2. 📈 Price Trigger (when ETH > $4000)");
        console.log("3. 🎯 Reach Target (contribute " + ethers.formatEther(needed) + " more ETH)");
        console.log("4. ⚠️  Emergency Refund (after " + Math.floor(timeLeft / (24*60*60)) + " days)");
        
        console.log("\n💡 EASIEST METHOD FOR YOU:");
        console.log("   Since you're the only member, just vote to release:");
        console.log("   await ftgContract.voteToRelease(1);");
        
    } catch (error: any) {
        console.error("❌ Error:", error.message);
        
        // If vault doesn't exist, show how to create one for testing
        console.log("\n📝 No active vault found. To test withdrawals:");
        console.log("1. Create a new vault with funds:");
        console.log("   npx hardhat run scripts/FTG_hackathon_demo.ts --network coston2");
        console.log("2. Then run this withdrawal guide again");
    }
}

main()
    .then(() => {
        console.log("\n🎉 Withdrawal guide completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });