import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

async function main() {
    console.log("💰 FTG - Add Funds to Contract");
    console.log("==============================\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Your Wallet:", deployer.address);

    // Connect to contract
    const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
    const ftgContract = FTG_TravelVault.attach(CONTRACT_ADDRESS) as any;

    // Check your current balance
    const yourBalance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Your Balance:", ethers.formatEther(yourBalance), "ETH");

    // Check contract balance
    const contractBalance = await deployer.provider.getBalance(CONTRACT_ADDRESS);
    console.log("💰 Contract Balance:", ethers.formatEther(contractBalance), "ETH");

    console.log("\n" + "=".repeat(50));
    console.log("💸 ADDING FUNDS TO CONTRACT");
    console.log("=".repeat(50));

    // Method 1: Contribute to existing vault
    const vaultId = 1;
    
    try {
        // Check if vault exists
        const vaultInfo = await ftgContract.getVaultInfo(vaultId);
        
        console.log("📊 Vault Info:");
        console.log("   Vault ID:", vaultId);
        console.log("   Current Amount:", ethers.formatEther(vaultInfo.currentAmount), "ETH");
        console.log("   Target Amount:", ethers.formatEther(vaultInfo.targetAmount), "ETH");
        console.log("   Members:", vaultInfo.memberCount.toString());
        console.log("   Active:", vaultInfo.isActive);

        // Calculate how much more is needed
        const needed = Number(vaultInfo.targetAmount) - Number(vaultInfo.currentAmount);
        const neededEth = ethers.formatEther(needed > 0 ? needed : 0);

        if (needed > 0) {
            console.log("   Still Needed:", neededEth, "ETH");
        } else {
            console.log("   ✅ Target already reached!");
        }

        // Contribute to the vault
        const contributionAmount = ethers.parseEther("1.0"); // 1 ETH
        
        console.log("\n🔄 Contributing 1 ETH to vault...");
        
        const contributeTx = await ftgContract.contribute(vaultId, {
            value: contributionAmount
        });

        console.log("📤 Transaction sent:", contributeTx.hash);
        console.log("⏳ Waiting for confirmation...");

        await contributeTx.wait();
        console.log("✅ Contribution confirmed!");

        // Check updated balances
        const newContractBalance = await deployer.provider.getBalance(CONTRACT_ADDRESS);
        const newYourBalance = await deployer.provider.getBalance(deployer.address);
        const updatedVaultInfo = await ftgContract.getVaultInfo(vaultId);

        console.log("\n💰 Updated Balances:");
        console.log("   Your Balance:", ethers.formatEther(newYourBalance), "ETH");
        console.log("   Contract Balance:", ethers.formatEther(newContractBalance), "ETH");
        console.log("   Vault Amount:", ethers.formatEther(updatedVaultInfo.currentAmount), "ETH");

        const increase = newContractBalance - contractBalance;
        console.log("   📈 Contract Increase:", ethers.formatEther(increase), "ETH");

        console.log("\n✅ SUCCESS! Funds added to contract!");

    } catch (error: any) {
        if (error.message.includes("Vault does not exist")) {
            console.log("❌ Vault doesn't exist. Creating new vault...");
            
            // Create a new vault first
            console.log("\n🏗️ Creating new vault...");
            
            const targetAmount = ethers.parseEther("3.0"); // 3 ETH target
            const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
            const triggerPrice = 400000; // $4000 in cents
            
            const createTx = await ftgContract.createVault(
                "Travel Fund",
                targetAmount,
                deadline,
                triggerPrice
            );
            
            await createTx.wait();
            console.log("✅ New vault created!");
            
            // Now contribute to the new vault
            const contributionAmount = ethers.parseEther("1.0");
            
            console.log("🔄 Contributing 1 ETH to new vault...");
            
            const contributeTx = await ftgContract.contribute(1, {
                value: contributionAmount
            });
            
            await contributeTx.wait();
            console.log("✅ Contribution to new vault confirmed!");
            
        } else {
            console.error("❌ Error:", error.message);
        }
    }
}

main()
    .then(() => {
        console.log("\n🎉 Fund addition completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });