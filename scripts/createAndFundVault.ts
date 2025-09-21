import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

async function main() {
    console.log("🏗️ Create New Vault & Add Funds");
    console.log("================================\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Your Wallet:", deployer.address);

    // Connect to contract
    const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
    const ftgContract = FTG_TravelVault.attach(CONTRACT_ADDRESS) as any;

    // Check current balances
    const yourBalance = await deployer.provider.getBalance(deployer.address);
    const contractBalance = await deployer.provider.getBalance(CONTRACT_ADDRESS);

    console.log("💰 Current Balances:");
    console.log("   Your Balance:", ethers.formatEther(yourBalance), "ETH");
    console.log("   Contract Balance:", ethers.formatEther(contractBalance), "ETH");

    console.log("\n🏗️ Creating New Travel Vault...");

    // Create new vault parameters
    const vaultName = "Hawaii Trip 2025";
    const targetAmount = ethers.parseEther("3.0"); // 3 ETH target
    const daysFromNow = 45; // 45 days deadline
    const deadline = Math.floor(Date.now() / 1000) + (daysFromNow * 24 * 60 * 60);
    const triggerPrice = 350000; // $3500 in cents (lower trigger for demo)
    
    // FTSO feed ID for ETH/USD (Flare network specific)
    const ethUsdFeedId = "0x01464554482f555344000000000000000000000000"; // ETH/USD feed
    const isLowerBound = false; // Trigger when price goes ABOVE the trigger

    console.log("📋 New Vault Details:");
    console.log("   Name:", vaultName);
    console.log("   Target:", ethers.formatEther(targetAmount), "ETH");
    console.log("   Deadline:", new Date(deadline * 1000).toLocaleDateString());
    console.log("   Price Trigger: $" + (triggerPrice / 100).toFixed(2));
    console.log("   Feed ID:", ethUsdFeedId);
    console.log("   Trigger Type:", isLowerBound ? "Below price" : "Above price");

    try {
        console.log("\n🔄 Creating vault...");
        
        const createTx = await ftgContract.createVault(
            vaultName,
            targetAmount,
            deadline,
            ethUsdFeedId,
            triggerPrice,
            isLowerBound
        );

        console.log("📤 Transaction sent:", createTx.hash);
        await createTx.wait();
        console.log("✅ Vault created successfully!");

        // Get the new vault ID (should be 2 since vault 1 exists)
        const newVaultId = 2;
        
        console.log("\n💰 Adding Initial Funds...");
        const initialContribution = ethers.parseEther("1.5"); // 1.5 ETH initial
        
        console.log("🔄 Contributing", ethers.formatEther(initialContribution), "ETH to vault", newVaultId, "...");
        
        const contributeTx = await ftgContract.contribute(newVaultId, {
            value: initialContribution
        });

        console.log("📤 Contribution transaction:", contributeTx.hash);
        await contributeTx.wait();
        console.log("✅ Contribution successful!");

        // Check updated balances and vault info
        const newContractBalance = await deployer.provider.getBalance(CONTRACT_ADDRESS);
        const newYourBalance = await deployer.provider.getBalance(deployer.address);
        const vaultInfo = await ftgContract.getVaultInfo(newVaultId);

        console.log("\n💰 Updated Balances:");
        console.log("   Your Balance:", ethers.formatEther(newYourBalance), "ETH");
        console.log("   Contract Balance:", ethers.formatEther(newContractBalance), "ETH");

        console.log("\n📊 New Vault Status:");
        console.log("   Vault ID:", newVaultId);
        console.log("   Name:", vaultName);
        console.log("   Current Amount:", ethers.formatEther(vaultInfo.currentAmount), "ETH");
        console.log("   Target Amount:", ethers.formatEther(vaultInfo.targetAmount), "ETH");
        console.log("   Progress:", ((Number(vaultInfo.currentAmount) / Number(vaultInfo.targetAmount)) * 100).toFixed(1), "%");
        console.log("   Members:", vaultInfo.memberCount.toString());
        console.log("   Active:", vaultInfo.isActive);
        console.log("   Funds Released:", vaultInfo.fundsReleased);

        const contractIncrease = newContractBalance - contractBalance;
        console.log("\n📈 Contract Balance Increased by:", ethers.formatEther(contractIncrease), "ETH");

        console.log("\n✅ SUCCESS! New vault created and funded!");
        console.log("🎯 You can now add more funds using vault ID:", newVaultId);

        // Show how to add more funds
        console.log("\n💡 To add more funds later, run:");
        console.log("   npx hardhat run scripts/addMoreFunds.ts --network coston2");

    } catch (error: any) {
        console.error("❌ Error:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Get more testnet funds: https://coston2-faucet.towolabs.com/");
        } else if (error.message.includes("revert")) {
            console.log("💡 Contract reverted - check vault parameters");
        }
    }
}

main()
    .then(() => {
        console.log("\n🎉 Vault creation and funding completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });