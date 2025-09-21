import { ethers } from "hardhat";
import * as readline from 'readline';

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    console.log("💰 Interactive Fund Addition to FTG Contract");
    console.log("============================================\n");

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

    console.log("\n📋 Choose funding method:");
    console.log("1. 🎯 Contribute to existing vault (recommended)");
    console.log("2. 🏗️ Create new vault and contribute");
    console.log("3. 💸 Direct transfer to contract");

    const choice = await askQuestion("\nEnter choice (1, 2, or 3): ");

    try {
        if (choice === "1") {
            // Contribute to existing vault
            const vaultId = await askQuestion("Enter vault ID to contribute to (e.g., 1): ");
            
            try {
                const vaultInfo = await ftgContract.getVaultInfo(parseInt(vaultId));
                console.log("\n📊 Vault Info:");
                console.log("   Current Amount:", ethers.formatEther(vaultInfo.currentAmount), "ETH");
                console.log("   Target Amount:", ethers.formatEther(vaultInfo.targetAmount), "ETH");
                console.log("   Members:", vaultInfo.memberCount.toString());
                
                const amount = await askQuestion("Enter amount to contribute (ETH): ");
                const contributionAmount = ethers.parseEther(amount);
                
                console.log(`\n🔄 Contributing ${amount} ETH to vault ${vaultId}...`);
                
                const contributeTx = await ftgContract.contribute(parseInt(vaultId), {
                    value: contributionAmount
                });
                
                await contributeTx.wait();
                console.log("✅ Contribution successful!");
                
            } catch (vaultError: any) {
                if (vaultError.message.includes("Vault does not exist")) {
                    console.log("❌ Vault doesn't exist. Try option 2 to create a new vault.");
                } else {
                    console.log("❌ Error:", vaultError.message);
                }
            }

        } else if (choice === "2") {
            // Create new vault and contribute
            console.log("\n🏗️ Creating new vault...");
            
            const vaultName = await askQuestion("Enter vault name (e.g., 'Tokyo Trip'): ");
            const targetAmount = await askQuestion("Enter target amount (ETH): ");
            const days = await askQuestion("Enter deadline in days (e.g., 30): ");
            const triggerPrice = await askQuestion("Enter ETH trigger price in USD (e.g., 4000): ");
            
            const deadline = Math.floor(Date.now() / 1000) + (parseInt(days) * 24 * 60 * 60);
            const triggerPriceCents = parseInt(triggerPrice) * 100; // Convert to cents
            
            console.log("\n🔄 Creating vault...");
            
            const createTx = await ftgContract.createVault(
                vaultName,
                ethers.parseEther(targetAmount),
                deadline,
                triggerPriceCents
            );
            
            await createTx.wait();
            console.log("✅ Vault created!");
            
            const contributionAmount = await askQuestion("Enter initial contribution (ETH): ");
            
            console.log(`\n🔄 Contributing ${contributionAmount} ETH to new vault...`);
            
            const contributeTx = await ftgContract.contribute(1, {
                value: ethers.parseEther(contributionAmount)
            });
            
            await contributeTx.wait();
            console.log("✅ Initial contribution successful!");

        } else if (choice === "3") {
            // Direct transfer
            const amount = await askQuestion("Enter amount to transfer directly (ETH): ");
            const transferAmount = ethers.parseEther(amount);
            
            console.log(`\n🔄 Transferring ${amount} ETH directly to contract...`);
            
            const sendTx = await deployer.sendTransaction({
                to: CONTRACT_ADDRESS,
                value: transferAmount
            });
            
            await sendTx.wait();
            console.log("✅ Direct transfer successful!");
            console.log("⚠️  Note: Funds are in contract but not assigned to any vault");

        } else {
            console.log("❌ Invalid choice");
            rl.close();
            return;
        }

        // Show updated balances
        const newYourBalance = await deployer.provider.getBalance(deployer.address);
        const newContractBalance = await deployer.provider.getBalance(CONTRACT_ADDRESS);

        console.log("\n💰 Updated Balances:");
        console.log("   Your Balance:", ethers.formatEther(newYourBalance), "ETH");
        console.log("   Contract Balance:", ethers.formatEther(newContractBalance), "ETH");
        
        const increase = newContractBalance - contractBalance;
        console.log("   📈 Contract Increase:", ethers.formatEther(increase), "ETH");

        console.log("\n🎉 Fund addition completed successfully!");

    } catch (error: any) {
        console.error("❌ Error:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Get more testnet funds: https://coston2-faucet.towolabs.com/");
        }
    }

    rl.close();
}

main().catch((error) => {
    console.error("Error:", error);
    rl.close();
    process.exit(1);
});