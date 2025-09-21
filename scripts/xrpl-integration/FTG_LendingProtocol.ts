// Lending and Borrowing against Travel Vault Shares
// Enables liquidity for travel savers

import { ethers } from "hardhat";

interface LendingPool {
    poolName: string;
    totalLiquidity: string; // Total ETH available to borrow
    totalBorrowed: string;  // Total ETH currently borrowed
    interestRate: number;   // Annual interest rate (%)
    collateralRatio: number; // Required collateral ratio (150% = 1.5)
    liquidationThreshold: number; // Liquidation threshold (120% = 1.2)
}

interface LoanPosition {
    borrower: string;
    collateralVaultId: number;
    collateralAmount: string; // Travel tokens used as collateral
    borrowedAmount: string;   // ETH borrowed
    interestRate: number;
    startTime: number;
    lastPayment: number;
    accruedInterest: string;
    isActive: boolean;
}

interface LendingPosition {
    lender: string;
    amount: string;          // ETH lent
    interestRate: number;
    startTime: number;
    accruedInterest: string;
}

export class FTG_LendingProtocol {
    private flareContract: any;
    private lendingPools: Map<string, LendingPool> = new Map();
    private loans: LoanPosition[] = [];
    private lendingPositions: LendingPosition[] = [];
    private nextLoanId: number = 1;

    constructor() {
        this.initializeLendingPools();
    }

    /**
     * Initialize lending pools
     */
    private initializeLendingPools() {
        // Main travel lending pool
        this.lendingPools.set('TRAVEL_MAIN', {
            poolName: 'Travel Savings Pool',
            totalLiquidity: '100.0',
            totalBorrowed: '0.0',
            interestRate: 8.5, // 8.5% APR for borrowers
            collateralRatio: 1.5, // 150% collateralization required
            liquidationThreshold: 1.2 // Liquidate at 120%
        });

        // Emergency travel lending
        this.lendingPools.set('EMERGENCY', {
            poolName: 'Emergency Travel Fund',
            totalLiquidity: '50.0',
            totalBorrowed: '0.0',
            interestRate: 12.0, // Higher rate for emergency loans
            collateralRatio: 1.3, // Lower collateral for emergencies
            liquidationThreshold: 1.15
        });

        console.log("✅ Initialized", this.lendingPools.size, "lending pools");
    }

    /**
     * Connect to FTG contract
     */
    async connectToFTGContract(contractAddress: string) {
        const FTG_TravelVault = await ethers.getContractFactory("FTG_TravelVault");
        this.flareContract = FTG_TravelVault.attach(contractAddress);
        console.log("✅ Connected to FTG contract for lending protocol");
    }

    /**
     * Lend ETH to the protocol for yield
     */
    async lendToPool(lenderAddress: string, amount: string, poolName: string = 'TRAVEL_MAIN') {
        try {
            const pool = this.lendingPools.get(poolName);
            if (!pool) {
                throw new Error(`Pool ${poolName} not found`);
            }

            const lendAmount = parseFloat(amount);
            if (lendAmount < 0.1) {
                throw new Error("Minimum lending amount is 0.1 ETH");
            }

            console.log(`💰 Lending ${amount} ETH to ${pool.poolName}`);
            console.log(`   Expected APY: ${pool.interestRate * 0.8}%`); // Lenders get 80% of borrower rate

            // Create lending position
            const position: LendingPosition = {
                lender: lenderAddress,
                amount: amount,
                interestRate: pool.interestRate * 0.8, // Lenders get 80% of borrower rate
                startTime: Math.floor(Date.now() / 1000),
                accruedInterest: '0'
            };

            this.lendingPositions.push(position);

            // Update pool liquidity
            pool.totalLiquidity = (parseFloat(pool.totalLiquidity) + lendAmount).toString();
            this.lendingPools.set(poolName, pool);

            console.log("✅ Lending position created!");
            return position;

        } catch (error) {
            console.error("❌ Lending failed:", error);
            throw error;
        }
    }

    /**
     * Borrow ETH against travel vault shares
     */
    async borrowAgainstVault(
        borrowerAddress: string,
        vaultId: number,
        borrowAmount: string,
        poolName: string = 'TRAVEL_MAIN'
    ) {
        try {
            const pool = this.lendingPools.get(poolName);
            if (!pool) {
                throw new Error(`Pool ${poolName} not found`);
            }

            // Get vault info and user's contribution
            const vaultInfo = await this.flareContract.getVaultInfo(vaultId);
            const userContribution = vaultInfo.contributions?.[borrowerAddress] || 0;
            
            if (userContribution === 0) {
                throw new Error("No vault shares found for collateral");
            }

            const collateralValue = parseFloat(ethers.formatEther(userContribution));
            const requestedBorrow = parseFloat(borrowAmount);
            const requiredCollateral = requestedBorrow * pool.collateralRatio;

            console.log(`🏦 Borrow Request Analysis:`);
            console.log(`   Requested: ${borrowAmount} ETH`);
            console.log(`   Collateral Value: ${collateralValue} ETH`);
            console.log(`   Required Collateral: ${requiredCollateral} ETH`);
            console.log(`   Collateral Ratio: ${pool.collateralRatio * 100}%`);

            // Check collateral sufficiency
            if (collateralValue < requiredCollateral) {
                throw new Error(`Insufficient collateral. Need ${requiredCollateral} ETH, have ${collateralValue} ETH`);
            }

            // Check pool liquidity
            const availableLiquidity = parseFloat(pool.totalLiquidity) - parseFloat(pool.totalBorrowed);
            if (requestedBorrow > availableLiquidity) {
                throw new Error(`Insufficient pool liquidity. Available: ${availableLiquidity} ETH`);
            }

            // Create loan position
            const loan: LoanPosition = {
                borrower: borrowerAddress,
                collateralVaultId: vaultId,
                collateralAmount: ethers.formatEther(userContribution),
                borrowedAmount: borrowAmount,
                interestRate: pool.interestRate,
                startTime: Math.floor(Date.now() / 1000),
                lastPayment: Math.floor(Date.now() / 1000),
                accruedInterest: '0',
                isActive: true
            };

            this.loans.push(loan);

            // Update pool
            pool.totalBorrowed = (parseFloat(pool.totalBorrowed) + requestedBorrow).toString();
            this.lendingPools.set(poolName, pool);

            console.log("✅ Loan approved and funded!");
            console.log(`   Loan ID: ${this.loans.length}`);
            console.log(`   Interest Rate: ${pool.interestRate}% APR`);

            return {
                loanId: this.loans.length,
                loan: loan
            };

        } catch (error) {
            console.error("❌ Borrowing failed:", error);
            throw error;
        }
    }

    /**
     * Calculate accrued interest for a loan
     */
    calculateAccruedInterest(loan: LoanPosition): string {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeElapsed = currentTime - loan.startTime;
        const yearsElapsed = timeElapsed / (365 * 24 * 60 * 60);
        
        const principal = parseFloat(loan.borrowedAmount);
        const interest = principal * (loan.interestRate / 100) * yearsElapsed;
        
        return interest.toFixed(6);
    }

    /**
     * Get loan status and health
     */
    getLoanHealth(loanId: number): any {
        const loan = this.loans[loanId - 1];
        if (!loan || !loan.isActive) {
            return null;
        }

        const accruedInterest = this.calculateAccruedInterest(loan);
        const totalDebt = parseFloat(loan.borrowedAmount) + parseFloat(accruedInterest);
        const collateralValue = parseFloat(loan.collateralAmount);
        const currentRatio = collateralValue / totalDebt;

        // Get liquidation threshold from pool
        const poolName = totalDebt > 10 ? 'TRAVEL_MAIN' : 'EMERGENCY';
        const pool = this.lendingPools.get(poolName);
        const liquidationThreshold = pool?.liquidationThreshold || 1.2;

        const isHealthy = currentRatio > liquidationThreshold;
        const isAtRisk = currentRatio < liquidationThreshold * 1.1; // Within 10% of liquidation

        return {
            loanId,
            borrower: loan.borrower,
            principal: loan.borrowedAmount,
            accruedInterest,
            totalDebt: totalDebt.toFixed(6),
            collateralValue: loan.collateralAmount,
            collateralRatio: currentRatio.toFixed(3),
            liquidationThreshold: liquidationThreshold.toFixed(3),
            healthStatus: isHealthy ? (isAtRisk ? 'AT_RISK' : 'HEALTHY') : 'LIQUIDATABLE',
            daysUntilPayment: 30 // Simplified - would be calculated based on payment schedule
        };
    }

    /**
     * Repay loan (partial or full)
     */
    async repayLoan(loanId: number, repaymentAmount: string) {
        try {
            const loan = this.loans[loanId - 1];
            if (!loan || !loan.isActive) {
                throw new Error("Loan not found or already closed");
            }

            const accruedInterest = this.calculateAccruedInterest(loan);
            const totalDebt = parseFloat(loan.borrowedAmount) + parseFloat(accruedInterest);
            const repayAmount = parseFloat(repaymentAmount);

            console.log(`💳 Loan Repayment:`);
            console.log(`   Loan ID: ${loanId}`);
            console.log(`   Principal: ${loan.borrowedAmount} ETH`);
            console.log(`   Accrued Interest: ${accruedInterest} ETH`);
            console.log(`   Total Debt: ${totalDebt.toFixed(6)} ETH`);
            console.log(`   Repayment: ${repaymentAmount} ETH`);

            if (repayAmount > totalDebt) {
                console.log("⚠️ Repayment exceeds debt. Adjusting to exact amount.");
            }

            const actualRepayment = Math.min(repayAmount, totalDebt);
            const remainingDebt = totalDebt - actualRepayment;

            // Update loan
            if (remainingDebt <= 0.001) { // Close loan if debt is negligible
                loan.isActive = false;
                console.log("✅ Loan fully repaid and closed!");
            } else {
                // Partial repayment - reduce principal proportionally
                const repaymentRatio = actualRepayment / totalDebt;
                loan.borrowedAmount = (parseFloat(loan.borrowedAmount) * (1 - repaymentRatio)).toString();
                loan.lastPayment = Math.floor(Date.now() / 1000);
                console.log(`✅ Partial repayment completed. Remaining debt: ${remainingDebt.toFixed(6)} ETH`);
            }

            // Update pool liquidity
            const poolName = 'TRAVEL_MAIN'; // Simplified
            const pool = this.lendingPools.get(poolName)!;
            pool.totalBorrowed = (parseFloat(pool.totalBorrowed) - actualRepayment).toString();
            this.lendingPools.set(poolName, pool);

            return {
                repaidAmount: actualRepayment.toFixed(6),
                remainingDebt: remainingDebt.toFixed(6),
                loanClosed: !loan.isActive
            };

        } catch (error) {
            console.error("❌ Repayment failed:", error);
            throw error;
        }
    }

    /**
     * Liquidate unhealthy loan
     */
    async liquidateLoan(loanId: number, liquidatorAddress: string) {
        try {
            const loanHealth = this.getLoanHealth(loanId);
            if (!loanHealth || loanHealth.healthStatus !== 'LIQUIDATABLE') {
                throw new Error("Loan is not eligible for liquidation");
            }

            const loan = this.loans[loanId - 1];
            
            console.log(`⚡ Liquidating loan ${loanId}`);
            console.log(`   Borrower: ${loan.borrower}`);
            console.log(`   Liquidator: ${liquidatorAddress}`);
            console.log(`   Collateral: ${loan.collateralAmount} ETH`);
            console.log(`   Debt: ${loanHealth.totalDebt} ETH`);

            // Liquidator pays the debt and receives collateral (with discount)
            const liquidationDiscount = 0.05; // 5% discount for liquidator
            const collateralReceived = parseFloat(loan.collateralAmount) * (1 - liquidationDiscount);

            // Close loan
            loan.isActive = false;

            // Update pool
            const poolName = 'TRAVEL_MAIN';
            const pool = this.lendingPools.get(poolName)!;
            pool.totalBorrowed = (parseFloat(pool.totalBorrowed) - parseFloat(loan.borrowedAmount)).toString();
            this.lendingPools.set(poolName, pool);

            console.log("✅ Loan liquidated successfully!");
            console.log(`   Liquidator receives: ${collateralReceived.toFixed(6)} ETH worth of travel tokens`);

            return {
                liquidatedDebt: loanHealth.totalDebt,
                collateralSeized: loan.collateralAmount,
                liquidatorReward: (collateralReceived - parseFloat(loanHealth.totalDebt)).toFixed(6)
            };

        } catch (error) {
            console.error("❌ Liquidation failed:", error);
            throw error;
        }
    }

    /**
     * Get all loans for a borrower
     */
    getUserLoans(borrowerAddress: string): any[] {
        return this.loans
            .map((loan, index) => ({ ...loan, loanId: index + 1 }))
            .filter(loan => loan.borrower === borrowerAddress && loan.isActive)
            .map(loan => ({
                ...loan,
                health: this.getLoanHealth(loan.loanId)
            }));
    }

    /**
     * Get lending positions for a lender
     */
    getUserLendingPositions(lenderAddress: string): any[] {
        return this.lendingPositions
            .filter(pos => pos.lender === lenderAddress)
            .map(pos => {
                const currentTime = Math.floor(Date.now() / 1000);
                const timeElapsed = currentTime - pos.startTime;
                const yearsElapsed = timeElapsed / (365 * 24 * 60 * 60);
                const earnedInterest = parseFloat(pos.amount) * (pos.interestRate / 100) * yearsElapsed;

                return {
                    ...pos,
                    earnedInterest: earnedInterest.toFixed(6),
                    totalValue: (parseFloat(pos.amount) + earnedInterest).toFixed(6)
                };
            });
    }

    /**
     * Get pool statistics
     */
    getPoolStats(): any {
        const stats = Array.from(this.lendingPools.entries()).map(([name, pool]) => {
            const utilizationRate = parseFloat(pool.totalBorrowed) / parseFloat(pool.totalLiquidity);
            const availableLiquidity = parseFloat(pool.totalLiquidity) - parseFloat(pool.totalBorrowed);

            return {
                poolName: pool.poolName,
                totalLiquidity: pool.totalLiquidity,
                totalBorrowed: pool.totalBorrowed,
                availableLiquidity: availableLiquidity.toFixed(6),
                utilizationRate: (utilizationRate * 100).toFixed(2) + '%',
                borrowRate: pool.interestRate + '%',
                lendRate: (pool.interestRate * 0.8).toFixed(1) + '%'
            };
        });

        return {
            pools: stats,
            totalActiveLoans: this.loans.filter(loan => loan.isActive).length,
            totalLendingPositions: this.lendingPositions.length
        };
    }
}

export default FTG_LendingProtocol;