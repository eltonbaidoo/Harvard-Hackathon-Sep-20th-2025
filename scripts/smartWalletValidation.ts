import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

async function main() {
    console.log("🎯 FTG - Smart Contract Wallet Validation");
    console.log("=========================================\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Validator (You):", deployer.address);
    
    // Connect to contract
    const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
    const ftgContract = FTG_TravelVault.attach(CONTRACT_ADDRESS) as any;

    // Demo wallet addresses to validate (you can replace these)
    const walletsToValidate = [
        "0x742C4B3E4D85B3dC5F2d3Aa1B2E1E8A6DdA9B7E3", // Example wallet 1
        "0x456E4F2B6A4F7C8D9E0F1A2B3C4D5E6F7G8H9I0J", // Example wallet 2
        deployer.address // Your own wallet for testing
    ];

    console.log("🧪 Testing Wallet Validation System");
    console.log("Wallets to validate:", walletsToValidate.length);

    const validationAmount = ethers.parseEther("0.05"); // 0.05 ETH
    const results: any[] = [];

    for (let i = 0; i < walletsToValidate.length; i++) {
        const targetWallet = walletsToValidate[i];
        console.log(`\n${"=".repeat(50)}`);
        console.log(`🎯 Validating Wallet ${i + 1}/${walletsToValidate.length}`);
        console.log(`Address: ${targetWallet}`);
        console.log(`${"=".repeat(50)}`);

        const validationResult = {
            address: targetWallet,
            exists: false,
            canReceive: false,
            initialBalance: "0",
            finalBalance: "0",
            validationSuccessful: false
        };

        try {
            // Step 1: Check if address is valid format
            if (!ethers.isAddress(targetWallet)) {
                console.log("❌ Invalid address format");
                validationResult.exists = false;
                results.push(validationResult);
                continue;
            }

            // Step 2: Check initial balance
            const initialBalance = await deployer.provider.getBalance(targetWallet);
            validationResult.initialBalance = ethers.formatEther(initialBalance);
            validationResult.exists = true;

            console.log("✅ Address format valid");
            console.log("💰 Initial balance:", validationResult.initialBalance, "ETH");

            // Step 3: Send validation amount
            console.log("🔄 Sending validation amount...");
            
            const sendTx = await deployer.sendTransaction({
                to: targetWallet,
                value: validationAmount
            });

            console.log("📤 Transaction:", sendTx.hash);
            await sendTx.wait();
            console.log("✅ Send transaction confirmed");

            // Step 4: Verify balance increased
            const newBalance = await deployer.provider.getBalance(targetWallet);
            validationResult.finalBalance = ethers.formatEther(newBalance);
            
            const balanceIncrease = newBalance - initialBalance;
            const expectedIncrease = validationAmount;

            if (balanceIncrease >= expectedIncrease) {
                validationResult.canReceive = true;
                console.log("✅ Wallet can receive funds");
                console.log("💰 New balance:", validationResult.finalBalance, "ETH");
                console.log("📈 Increase:", ethers.formatEther(balanceIncrease), "ETH");
            } else {
                console.log("❌ Balance did not increase as expected");
            }

            // Step 5: For demo purposes, if it's your own wallet, send back
            if (targetWallet.toLowerCase() === deployer.address.toLowerCase()) {
                console.log("🔄 Self-validation: funds already returned");
                validationResult.validationSuccessful = true;
            } else {
                console.log("⏳ Waiting for return transaction...");
                console.log("💡 In real scenario, wallet owner would send back funds");
                
                // For demo, we'll mark as successful if funds were received
                validationResult.validationSuccessful = validationResult.canReceive;
            }

        } catch (error: any) {
            console.log("❌ Validation error:", error.message);
            
            if (error.message.includes("insufficient funds")) {
                console.log("💡 Your wallet needs more funds for validation");
            }
        }

        results.push(validationResult);
    }

    // Display final results
    console.log("\n" + "=".repeat(60));
    console.log("📊 WALLET VALIDATION RESULTS");
    console.log("=".repeat(60));

    let validWallets = 0;
    let invalidWallets = 0;

    results.forEach((result, index) => {
        console.log(`\n👛 Wallet ${index + 1}:`);
        console.log(`   Address: ${result.address}`);
        console.log(`   Valid Format: ${result.exists ? "✅" : "❌"}`);
        console.log(`   Can Receive: ${result.canReceive ? "✅" : "❌"}`);
        console.log(`   Initial Balance: ${result.initialBalance} ETH`);
        console.log(`   Final Balance: ${result.finalBalance} ETH`);
        console.log(`   Validation: ${result.validationSuccessful ? "✅ SUCCESS" : "❌ PENDING"}`);

        if (result.validationSuccessful) {
            validWallets++;
        } else {
            invalidWallets++;
        }
    });

    console.log("\n📈 Summary:");
    console.log(`   ✅ Valid Wallets: ${validWallets}`);
    console.log(`   ❌ Invalid/Pending: ${invalidWallets}`);
    console.log(`   📊 Success Rate: ${((validWallets / results.length) * 100).toFixed(1)}%`);

    console.log("\n🎯 Validation Process Complete!");
    console.log("💡 This demo shows how to programmatically validate wallet addresses");
    console.log("🚀 Perfect for hackathon demonstrations of wallet verification!");
}

main()
    .then(() => {
        console.log("\n🎉 Wallet validation demo completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });