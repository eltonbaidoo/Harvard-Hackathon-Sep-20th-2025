import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

async function main() {
    console.log("💸 Direct ETH Transfer to Contract");
    console.log("==================================\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Sender:", deployer.address);
    console.log("🎯 Contract:", CONTRACT_ADDRESS);

    // Check balances before
    const yourBalanceBefore = await deployer.provider.getBalance(deployer.address);
    const contractBalanceBefore = await deployer.provider.getBalance(CONTRACT_ADDRESS);

    console.log("\n💰 Balances Before:");
    console.log("   Your Balance:", ethers.formatEther(yourBalanceBefore), "ETH");
    console.log("   Contract Balance:", ethers.formatEther(contractBalanceBefore), "ETH");

    // Amount to send
    const amountToSend = ethers.parseEther("0.5"); // 0.5 ETH
    
    console.log("\n🔄 Sending", ethers.formatEther(amountToSend), "ETH to contract...");

    try {
        // Send ETH directly to contract
        const sendTx = await deployer.sendTransaction({
            to: CONTRACT_ADDRESS,
            value: amountToSend
        });

        console.log("📤 Transaction Hash:", sendTx.hash);
        console.log("⏳ Waiting for confirmation...");

        const receipt = await sendTx.wait();
        console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);

        // Check balances after
        const yourBalanceAfter = await deployer.provider.getBalance(deployer.address);
        const contractBalanceAfter = await deployer.provider.getBalance(CONTRACT_ADDRESS);

        console.log("\n💰 Balances After:");
        console.log("   Your Balance:", ethers.formatEther(yourBalanceAfter), "ETH");
        console.log("   Contract Balance:", ethers.formatEther(contractBalanceAfter), "ETH");

        const contractIncrease = contractBalanceAfter - contractBalanceBefore;
        const yourDecrease = yourBalanceBefore - yourBalanceAfter;

        console.log("\n📈 Changes:");
        console.log("   Contract Gained:", ethers.formatEther(contractIncrease), "ETH");
        console.log("   You Spent:", ethers.formatEther(yourDecrease), "ETH");

        console.log("\n✅ SUCCESS! ETH transferred to contract!");
        
        // Note about direct transfers
        console.log("\n⚠️  Note: Direct transfers go to contract but not to any specific vault");
        console.log("💡 Use 'contribute()' method to add funds to a specific travel vault");

    } catch (error: any) {
        console.error("❌ Transfer failed:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Get more testnet funds: https://coston2-faucet.towolabs.com/");
        }
    }
}

main()
    .then(() => {
        console.log("\n🎉 Direct transfer completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });