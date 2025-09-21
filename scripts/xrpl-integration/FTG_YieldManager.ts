// Yield Products for FTG Travel Savings
// Generate yield on deposited travel funds

import { ethers } from "hardhat";

interface YieldStrategy {
    name: string;
    apy: number; // Annual percentage yield
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    minimumDeposit: string; // In ETH
}

interface YieldPosition {
    user: string;
    strategy: string;
    principal: string; // Original deposit in ETH
    earned: string;    // Yield earned in ETH
    startTime: number;
    lastClaim: number;
}

export class FTG_YieldManager {
    private flareContract: any;
    private yieldStrategies: Map<string, YieldStrategy> = new Map();
    private userPositions: Map<string, YieldPosition[]> = new Map();

    constructor() {
        this.initializeYieldStrategies();
    }

    /**
     * Initialize available yield strategies
     */
    private initializeYieldStrategies() {
        // Strategy 1: Conservative Staking
        this.yieldStrategies.set('CONSERVATIVE', {
            name: 'Travel Safe Staking',
            apy: 5.5, // 5.5% APY
            riskLevel: 'LOW',
            description: 'Stake ETH in validated protocols while saving for travel',
            minimumDeposit: '0.1'
        });

        // Strategy 2: DeFi Liquidity Provision
        this.yieldStrategies.set('LIQUIDITY', {
            name: 'Travel Liquidity Pool',
            apy: 12.0, // 12% APY
            riskLevel: 'MEDIUM',
            description: 'Provide liquidity to ETH/USDC pools for higher yields',
            minimumDeposit: '0.5'
        });

        // Strategy 3: Leveraged Yield Farming
        this.yieldStrategies.set('AGGRESSIVE', {
            name: 'Adventure Yield Farm',
            apy: 25.0, // 25% APY
            riskLevel: 'HIGH',
            description: 'High-risk, high-reward yield farming for adventurous travelers',
            minimumDeposit: '1.0'
        });

        // Strategy 4: Travel Token Staking (XRPL integration)
        this.yieldStrategies.set('TRAVEL_TOKENS', {
            name: 'Travel Token Rewards',
            apy: 8.0, // 8% APY
            riskLevel: 'LOW',
            description: 'Stake your travel tokens to earn additional rewards',
            minimumDeposit: '0.01'
        });

        console.log("✅ Initialized", this.yieldStrategies.size, "yield strategies");
    }

    /**
     * Connect to FTG contract for yield integration
     */
    async connectToFTGContract(contractAddress: string) {
        const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
        this.flareContract = FTG_TravelVault.attach(contractAddress);
        console.log("✅ Connected to FTG contract for yield integration");
    }

    /**
     * Enable yield generation on vault deposits
     */
    async enableYieldForVault(vaultId: number, strategyName: string, userAddress: string) {
        try {
            const strategy = this.yieldStrategies.get(strategyName);
            if (!strategy) {
                throw new Error(`Strategy ${strategyName} not found`);
            }

            // Get vault info
            const vaultInfo = await this.flareContract.getVaultInfo(vaultId);
            const userContribution = vaultInfo.contributions?.[userAddress] || 0;
            
            if (userContribution === 0) {
                throw new Error("No contribution found for this user in the vault");
            }

            const contributionETH = ethers.formatEther(userContribution);
            
            // Check minimum deposit
            if (parseFloat(contributionETH) < parseFloat(strategy.minimumDeposit)) {
                throw new Error(`Minimum deposit of ${strategy.minimumDeposit} ETH required for ${strategy.name}`);
            }

            console.log(`🌱 Enabling yield for vault ${vaultId}`);
            console.log(`   Strategy: ${strategy.name}`);
            console.log(`   Principal: ${contributionETH} ETH`);
            console.log(`   Expected APY: ${strategy.apy}%`);

            // Create yield position
            const position: YieldPosition = {
                user: userAddress,
                strategy: strategyName,
                principal: contributionETH,
                earned: '0',
                startTime: Math.floor(Date.now() / 1000),
                lastClaim: Math.floor(Date.now() / 1000)
            };

            // Store position
            const userPositions = this.userPositions.get(userAddress) || [];
            userPositions.push(position);
            this.userPositions.set(userAddress, userPositions);

            console.log("✅ Yield generation enabled!");
            return position;

        } catch (error) {
            console.error("❌ Failed to enable yield:", error);
            throw error;
        }
    }

    /**
     * Calculate current yield for a position
     */
    calculateYield(position: YieldPosition): string {
        const strategy = this.yieldStrategies.get(position.strategy);
        if (!strategy) return '0';

        const currentTime = Math.floor(Date.now() / 1000);
        const timeStaked = currentTime - position.startTime;
        const yearsStaked = timeStaked / (365 * 24 * 60 * 60);
        
        const principal = parseFloat(position.principal);
        const yieldEarned = principal * (strategy.apy / 100) * yearsStaked;
        
        return yieldEarned.toFixed(6);
    }

    /**
     * Get all yield positions for a user
     */
    async getUserYieldPositions(userAddress: string) {
        const positions = this.userPositions.get(userAddress) || [];
        
        const positionsWithYield = positions.map(position => {
            const currentYield = this.calculateYield(position);
            const strategy = this.yieldStrategies.get(position.strategy);
            
            return {
                ...position,
                currentYield,
                strategy: strategy,
                totalValue: (parseFloat(position.principal) + parseFloat(currentYield)).toFixed(6)
            };
        });

        return positionsWithYield;
    }

    /**
     * Claim yield rewards
     */
    async claimYield(userAddress: string, positionIndex: number) {
        try {
            const positions = this.userPositions.get(userAddress) || [];
            if (positionIndex >= positions.length) {
                throw new Error("Position not found");
            }

            const position = positions[positionIndex];
            const currentYield = this.calculateYield(position);
            
            if (parseFloat(currentYield) === 0) {
                throw new Error("No yield to claim");
            }

            console.log(`💰 Claiming ${currentYield} ETH yield`);
            console.log(`   From strategy: ${position.strategy}`);

            // Update position
            position.earned = (parseFloat(position.earned) + parseFloat(currentYield)).toFixed(6);
            position.lastClaim = Math.floor(Date.now() / 1000);
            
            // In real implementation, this would:
            // 1. Transfer yield to user's wallet
            // 2. Update on-chain state
            // 3. Handle tax implications
            
            console.log("✅ Yield claimed successfully!");
            return {
                amount: currentYield,
                totalEarned: position.earned,
                strategy: position.strategy
            };

        } catch (error) {
            console.error("❌ Failed to claim yield:", error);
            throw error;
        }
    }

    /**
     * Get total yield across all positions
     */
    async getTotalYieldStats(userAddress: string) {
        const positions = await this.getUserYieldPositions(userAddress);
        
        const stats = positions.reduce((acc, pos) => {
            acc.totalPrincipal += parseFloat(pos.principal);
            acc.totalYield += parseFloat(pos.currentYield);
            acc.totalValue += parseFloat(pos.totalValue);
            return acc;
        }, {
            totalPrincipal: 0,
            totalYield: 0,
            totalValue: 0,
            activePositions: positions.length
        });

        return {
            ...stats,
            averageAPY: positions.reduce((sum, pos) => sum + (pos.strategy?.apy || 0), 0) / Math.max(positions.length, 1)
        };
    }

    /**
     * Compound yield back into travel savings
     */
    async compoundYieldToVault(userAddress: string, positionIndex: number, vaultId: number) {
        try {
            const yieldClaim = await this.claimYield(userAddress, positionIndex);
            
            console.log(`🔄 Compounding ${yieldClaim.amount} ETH yield into vault ${vaultId}`);
            
            // In real implementation, this would:
            // 1. Claim the yield
            // 2. Automatically contribute it to the specified vault
            // 3. Issue additional travel tokens on XRPL
            // 4. Update yield positions
            
            console.log("✅ Yield compounded into travel savings!");
            return yieldClaim;

        } catch (error) {
            console.error("❌ Failed to compound yield:", error);
            throw error;
        }
    }

    /**
     * Get available yield strategies
     */
    getAvailableStrategies(): YieldStrategy[] {
        return Array.from(this.yieldStrategies.values());
    }

    /**
     * Emergency withdraw from yield strategy
     */
    async emergencyWithdraw(userAddress: string, positionIndex: number) {
        try {
            const positions = this.userPositions.get(userAddress) || [];
            const position = positions[positionIndex];
            
            console.log(`⚠️ Emergency withdrawal from ${position.strategy}`);
            console.log(`   Principal: ${position.principal} ETH`);
            console.log(`   Forfeit yield: ${this.calculateYield(position)} ETH`);
            
            // Remove position
            positions.splice(positionIndex, 1);
            this.userPositions.set(userAddress, positions);
            
            // In real implementation:
            // 1. Immediately withdraw principal
            // 2. Forfeit unclaimed yield
            // 3. May incur penalties
            
            console.log("✅ Emergency withdrawal completed");
            return position.principal;

        } catch (error) {
            console.error("❌ Emergency withdrawal failed:", error);
            throw error;
        }
    }
}

export default FTG_YieldManager;