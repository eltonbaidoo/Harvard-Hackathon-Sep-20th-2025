import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying FTG - Flare Travel Goals...\n");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

    // For demo purposes, we'll use a placeholder address and fix it later
    // In production, you'd use the official FTSO consumer contract
    const FTSO_CONSUMER_ADDRESS = "0x0000000000000000000000000000000000000000"; // Placeholder

    try {
        // Deploy FTG_TravelVault contract
        console.log("📦 Deploying FTG_TravelVault contract...");
        const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
        const ftgContract = await FTG_TravelVault.deploy(FTSO_CONSUMER_ADDRESS);
        
        await ftgContract.waitForDeployment();
        const contractAddress = await ftgContract.getAddress();
        
        console.log("✅ FTG_TravelVault deployed to:", contractAddress);
        console.log("🔗 View on explorer:", `https://coston2-explorer.flare.network/address/${contractAddress}\n`);

        // Get some contract info
        const nextVaultId = await (ftgContract as any).nextVaultId();
        console.log("📊 Contract Info:");
        console.log("   Next Vault ID:", nextVaultId.toString());
        console.log("   FTSO Consumer:", FTSO_CONSUMER_ADDRESS);
        
        // Display some example feed IDs
        console.log("\n🏷️  Available Price Feeds:");
        const ethUsdFeed = await (ftgContract as any).ETH_USD_FEED();
        const btcUsdFeed = await (ftgContract as any).BTC_USD_FEED();
        const flrUsdFeed = await (ftgContract as any).FLR_USD_FEED();
        
        console.log("   ETH/USD Feed:", ethUsdFeed);
        console.log("   BTC/USD Feed:", btcUsdFeed);
        console.log("   FLR/USD Feed:", flrUsdFeed);

        console.log("\n🎯 Example Usage:");
        console.log("1. Create a vault for 'Japan Trip 2025' with 10 ETH target");
        console.log("2. Set ETH/USD trigger at $4000 (release when ETH hits $4000)");
        console.log("3. Members contribute ETH until target reached");
        console.log("4. Funds auto-release when price trigger activates OR group votes");
        
        console.log("\n🔧 Next Steps:");
        console.log("- Run interaction scripts to test the contract");
        console.log("- Create vaults with different price triggers");
        console.log("- Test group contributions and voting");
        
        return {
            contractAddress,
            deployer: deployer.address
        };

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then((result) => {
        console.log("\n🎉 Deployment completed successfully!");
        console.log("Contract address:", result.contractAddress);
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Deployment failed:", error);
        process.exit(1);
    });