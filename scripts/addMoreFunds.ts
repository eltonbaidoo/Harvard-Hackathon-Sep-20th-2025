import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

async function main() {
    console.log("💰 Add More Funds to Existing Vault");
    console.log("===================================\n");

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

    // Try vault ID 2 (the new one we just created)
    const vaultId = 2;
    
    try {
        const vaultInfo = await ftgContract.getVaultInfo(vaultId);
        
        console.log(`\n📊 Vault ${vaultId} Status:`);
        console.log("   Current Amount:", ethers.formatEther(vaultInfo.currentAmount), "ETH");
        console.log("   Target Amount:", ethers.formatEther(vaultInfo.targetAmount), "ETH");
        console.log("   Progress:", ((Number(vaultInfo.currentAmount) / Number(vaultInfo.targetAmount)) * 100).toFixed(1), "%");
        console.log("   Active:", vaultInfo.isActive);

        if (!vaultInfo.isActive) {
            console.log("⚠️  Vault is not active. Funds may have been released.");
            console.log("💡 Creating a new vault instead...");
            
            // Create new vault
            const vaultName = "Beach Vacation 2025";
            const targetAmount = ethers.parseEther("2.5");
            const deadline = Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60); // 60 days
            const triggerPrice = 380000; // $3800
            
            const createTx = await ftgContract.createVault(
                vaultName,
                targetAmount,
                deadline,
                triggerPrice
            );
            
            await createTx.wait();
            console.log("✅ New vault created!");
            
            // Use the new vault ID (increment)
            const newVaultId = 3;
            
            const contributionAmount = ethers.parseEther("1.0");
            console.log(`\n🔄 Contributing ${ethers.formatEther(contributionAmount)} ETH to vault ${newVaultId}...`);
            
            const contributeTx = await ftgContract.contribute(newVaultId, {
                value: contributionAmount
            });
            
            await contributeTx.wait();
            console.log("✅ Contribution successful!");
            
        } else {
            // Add to existing active vault
            const additionalAmount = ethers.parseEther("0.8"); // 0.8 ETH more
            
            console.log(`\n🔄 Adding ${ethers.formatEther(additionalAmount)} ETH to vault ${vaultId}...`);
            
            const contributeTx = await ftgContract.contribute(vaultId, {
                value: additionalAmount
            });

            console.log("📤 Transaction sent:", contributeTx.hash);
            await contributeTx.wait();
            console.log("✅ Additional funds added successfully!");
        }

        // Check final balances
        const newContractBalance = await deployer.provider.getBalance(CONTRACT_ADDRESS);
        const newYourBalance = await deployer.provider.getBalance(deployer.address);

        console.log("\n💰 Final Balances:");
        console.log("   Your Balance:", ethers.formatEther(newYourBalance), "ETH");
        console.log("   Contract Balance:", ethers.formatEther(newContractBalance), "ETH");

        const increase = newContractBalance - contractBalance;
        console.log("   📈 Contract Increase:", ethers.formatEther(increase), "ETH");

        console.log("\n✅ SUCCESS! More funds added to contract!");

    } catch (error: any) {
        if (error.message.includes("Vault does not exist")) {
            console.log("❌ Vault doesn't exist. Run the createAndFundVault script first:");
            console.log("   npx hardhat run scripts/createAndFundVault.ts --network coston2");
        } else {
            console.error("❌ Error:", error.message);
        }
    }
}

main()
    .then(() => {
        console.log("\n🎉 Additional funding completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });