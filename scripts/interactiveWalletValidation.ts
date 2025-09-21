import { ethers } from "hardhat";
import * as readline from 'readline';

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

// Create readline interface for user input
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
    console.log("🧪 FTG - Interactive Wallet Validation");
    console.log("======================================\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Your Wallet:", deployer.address);
    
    const yourBalance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Your Balance:", ethers.formatEther(yourBalance), "ETH\n");

    // Get target wallet from user
    const targetWallet = await askQuestion("🎯 Enter wallet address to validate: ");
    
    // Validate address format
    if (!ethers.isAddress(targetWallet)) {
        console.log("❌ Invalid wallet address format!");
        rl.close();
        return;
    }

    console.log("\n📋 Validation Process Starting...");
    console.log("Target Wallet:", targetWallet);

    // Check target wallet balance
    const targetBalance = await deployer.provider.getBalance(targetWallet);
    console.log("Target Balance:", ethers.formatEther(targetBalance), "ETH");

    // Ask for validation amount
    const amountInput = await askQuestion("\n💸 Enter amount to send for validation (ETH, e.g., 0.01): ");
    const validationAmount = ethers.parseEther(amountInput);

    // Confirm the action
    const confirm = await askQuestion(`\n⚠️  Confirm: Send ${amountInput} ETH to ${targetWallet}? (yes/no): `);
    
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log("❌ Validation cancelled.");
        rl.close();
        return;
    }

    try {
        console.log("\n🔄 Sending validation amount...");
        
        // Send ETH to target wallet
        const sendTx = await deployer.sendTransaction({
            to: targetWallet,
            value: validationAmount
        });
        
        console.log("📤 Transaction Hash:", sendTx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await sendTx.wait();
        console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);

        // Check new balances
        const yourNewBalance = await deployer.provider.getBalance(deployer.address);
        const targetNewBalance = await deployer.provider.getBalance(targetWallet);
        
        console.log("\n💰 Updated Balances:");
        console.log("   Your balance:", ethers.formatEther(yourNewBalance), "ETH");
        console.log("   Target balance:", ethers.formatEther(targetNewBalance), "ETH");

        console.log("\n✅ WALLET VALIDATION STEP 1 COMPLETE!");
        console.log("🎯 Funds successfully sent to target wallet");
        
        console.log("\n📋 Next Steps for Complete Validation:");
        console.log("1. ✅ Send completed - wallet exists and can receive funds");
        console.log("2. 📝 Ask wallet owner to send back the amount to prove control");
        console.log("3. 🔍 Monitor your wallet for the return transaction");
        console.log("4. ✅ Validation complete when funds are returned");

        console.log("\n🎉 Wallet validation initiated successfully!");
        console.log("💡 Wallet owner should now return", amountInput, "ETH to:", deployer.address);

        // Offer to monitor for return
        const monitor = await askQuestion("\n🔍 Monitor for return transaction? (yes/no): ");
        
        if (monitor.toLowerCase() === 'yes' || monitor.toLowerCase() === 'y') {
            console.log("\n⏳ Monitoring for return transaction...");
            console.log("💡 Press Ctrl+C to stop monitoring");
            
            const startBalance = await deployer.provider.getBalance(deployer.address);
            
            // Simple monitoring loop
            const monitorInterval = setInterval(async () => {
                const currentBalance = await deployer.provider.getBalance(deployer.address);
                const difference = currentBalance - startBalance;
                
                if (difference > ethers.parseEther("0.001")) { // Allow for small gas differences
                    console.log("\n🎉 RETURN DETECTED!");
                    console.log("💰 Balance increased by:", ethers.formatEther(difference), "ETH");
                    console.log("✅ WALLET VALIDATION COMPLETE!");
                    console.log("🎯 Target wallet is confirmed functional and controlled");
                    
                    clearInterval(monitorInterval);
                    rl.close();
                }
            }, 5000); // Check every 5 seconds
            
            // Auto-stop monitoring after 2 minutes
            setTimeout(() => {
                clearInterval(monitorInterval);
                console.log("\n⏰ Monitoring timeout reached");
                console.log("💡 Continue checking manually or run monitor again");
                rl.close();
            }, 120000);
        } else {
            rl.close();
        }

    } catch (error: any) {
        console.error("\n❌ Validation Failed:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Get more testnet funds: https://coston2-faucet.towolabs.com/");
        }
        
        rl.close();
    }
}

main().catch((error) => {
    console.error("Error:", error);
    rl.close();
    process.exit(1);
});