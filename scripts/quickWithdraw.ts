import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xA0285b335dEEB4127C73C9014924eDC46E70C505";

async function main() {
    console.log("🚀 Quick Withdrawal - Getting Your ETH Back!");

    const [deployer] = await ethers.getSigners();
    
    // Connect to contract
    const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
    const ftgContract = FTG_TravelVault.attach(CONTRACT_ADDRESS) as any;

    // Check balances before
    const contractBalance = await deployer.provider.getBalance(CONTRACT_ADDRESS);
    const yourBalanceBefore = await deployer.provider.getBalance(deployer.address);
    
    console.log("💰 Contract Balance:", ethers.formatEther(contractBalance), "ETH");
    console.log("💰 Your Balance:", ethers.formatEther(yourBalanceBefore), "ETH");

    if (contractBalance == 0n) {
        console.log("✅ Contract is already empty!");
        return;
    }

    // Try to withdraw using the easiest method (group vote)
    const vaultId = 1;
    
    try {
        console.log("\n🗳️ Attempting group vote withdrawal...");
        const voteTx = await ftgContract.voteToRelease(vaultId);
        console.log("⏳ Transaction sent, waiting for confirmation...");
        await voteTx.wait();
        
        // Check results
        const contractBalanceAfter = await deployer.provider.getBalance(CONTRACT_ADDRESS);
        const yourBalanceAfter = await deployer.provider.getBalance(deployer.address);
        const withdrawn = contractBalance - contractBalanceAfter;
        
        console.log("\n✅ SUCCESS! Funds withdrawn!");
        console.log("💸 Amount withdrawn:", ethers.formatEther(withdrawn), "ETH");
        console.log("💰 Contract Balance now:", ethers.formatEther(contractBalanceAfter), "ETH");
        console.log("💰 Your Balance now:", ethers.formatEther(yourBalanceAfter), "ETH");
        
    } catch (error: any) {
        console.log("❌ Group vote failed:", error.message);
        
        if (error.message.includes("Already voted")) {
            console.log("💡 You already voted! Funds may have been released already.");
        } else {
            console.log("💡 Try the full withdrawal guide for other methods:");
            console.log("   npx hardhat run scripts/withdrawalGuide.ts --network coston2");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });