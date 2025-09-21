// XRPL Asset Issuance for Travel Tokens
// This integrates with your existing FTG Flare contract

import { Client, Wallet, TrustSet, Payment, AccountObjects } from 'xrpl';

// XRPL Testnet configuration
const XRPL_SERVER = 'wss://s.altnet.rippletest.net:51233';

export class FTG_XRPL_TokenManager {
    private client: Client;
    private issuerWallet: Wallet;
    
    constructor(issuerSeed?: string) {
        this.client = new Client(XRPL_SERVER);
        this.issuerWallet = issuerSeed ? Wallet.fromSeed(issuerSeed) : Wallet.generate();
    }

    /**
     * Create travel tokens representing vault shares
     * Each vault gets its own token type
     */
    async createTravelToken(vaultId: number, destination: string, totalShares: number) {
        await this.client.connect();
        
        const tokenCode = `FTG${vaultId.toString().padStart(3, '0')}`; // FTG001, FTG002, etc.
        
        console.log(`🏷️ Creating Travel Token: ${tokenCode}`);
        console.log(`   Destination: ${destination}`);
        console.log(`   Total Shares: ${totalShares}`);
        console.log(`   Issuer: ${this.issuerWallet.address}`);
        
        // The token is created when someone first creates a trust line to it
        // No explicit "creation" transaction needed on XRPL
        
        const tokenInfo = {
            tokenCode,
            issuer: this.issuerWallet.address,
            destination,
            totalShares,
            vaultId
        };
        
        await this.client.disconnect();
        return tokenInfo;
    }

    /**
     * Issue travel tokens to vault contributors
     * Called when someone contributes to a Flare vault
     */
    async issueTravelShares(
        recipientAddress: string, 
        tokenCode: string, 
        amount: string,
        vaultId: number
    ) {
        await this.client.connect();
        
        console.log(`💰 Issuing ${amount} ${tokenCode} to ${recipientAddress}`);
        
        try {
            // Issue tokens by sending them to the recipient
            const payment: Payment = {
                TransactionType: 'Payment',
                Account: this.issuerWallet.address,
                Destination: recipientAddress,
                Amount: {
                    currency: tokenCode,
                    value: amount,
                    issuer: this.issuerWallet.address
                },
                Memos: [{
                    Memo: {
                        MemoType: Buffer.from('FTG_VAULT_SHARES').toString('hex'),
                        MemoData: Buffer.from(`Vault ${vaultId} travel shares`).toString('hex')
                    }
                }]
            };

            const result = await this.client.submitAndWait(payment, {
                wallet: this.issuerWallet
            });

            console.log(`✅ Travel tokens issued! TX: ${result.result.hash}`);
            return result;

        } catch (error) {
            console.error('❌ Token issuance failed:', error);
            throw error;
        } finally {
            await this.client.disconnect();
        }
    }

    /**
     * Create trustline for receiving travel tokens
     * Users must do this before receiving tokens
     */
    async createTrustLine(userWallet: Wallet, tokenCode: string, limit: string = "1000000") {
        await this.client.connect();
        
        console.log(`🤝 Creating trust line for ${tokenCode}`);
        
        try {
            const trustSet: TrustSet = {
                TransactionType: 'TrustSet',
                Account: userWallet.address,
                LimitAmount: {
                    currency: tokenCode,
                    issuer: this.issuerWallet.address,
                    value: limit
                }
            };

            const result = await this.client.submitAndWait(trustSet, {
                wallet: userWallet
            });

            console.log(`✅ Trust line created! TX: ${result.result.hash}`);
            return result;

        } catch (error) {
            console.error('❌ Trust line creation failed:', error);
            throw error;
        } finally {
            await this.client.disconnect();
        }
    }

    /**
     * Check travel token balances
     */
    async getTravelTokenBalance(userAddress: string, tokenCode: string) {
        await this.client.connect();
        
        try {
            const response = await this.client.request({
                command: 'account_lines',
                account: userAddress,
                ledger_index: 'validated'
            });

            const tokenLine = response.result.lines.find(
                (line: any) => line.currency === tokenCode && line.account === this.issuerWallet.address
            );

            const balance = tokenLine ? tokenLine.balance : '0';
            console.log(`💰 ${userAddress} has ${balance} ${tokenCode}`);
            
            await this.client.disconnect();
            return balance;

        } catch (error) {
            console.error('❌ Balance check failed:', error);
            await this.client.disconnect();
            return '0';
        }
    }

    /**
     * Transfer travel tokens between users
     * Enables secondary market for travel shares
     */
    async transferTravelTokens(
        fromWallet: Wallet,
        toAddress: string,
        tokenCode: string,
        amount: string
    ) {
        await this.client.connect();
        
        console.log(`🔄 Transferring ${amount} ${tokenCode} from ${fromWallet.address} to ${toAddress}`);
        
        try {
            const payment: Payment = {
                TransactionType: 'Payment',
                Account: fromWallet.address,
                Destination: toAddress,
                Amount: {
                    currency: tokenCode,
                    value: amount,
                    issuer: this.issuerWallet.address
                }
            };

            const result = await this.client.submitAndWait(payment, {
                wallet: fromWallet
            });

            console.log(`✅ Travel tokens transferred! TX: ${result.result.hash}`);
            return result;

        } catch (error) {
            console.error('❌ Transfer failed:', error);
            throw error;
        } finally {
            await this.client.disconnect();
        }
    }
}

// Example usage:
async function demoTravelTokens() {
    console.log("🎯 FTG Travel Tokens Demo");
    console.log("=========================");
    
    // Create token manager
    const tokenManager = new FTG_XRPL_TokenManager();
    
    // Create travel token for vault
    const tokenInfo = await tokenManager.createTravelToken(
        2, // vault ID from your Flare contract
        "Hawaii Trip 2025",
        1000 // 1000 total shares
    );
    
    console.log("Travel token created:", tokenInfo);
    
    // Note: In real integration, you'd:
    // 1. Listen to Flare vault contributions
    // 2. Automatically issue XRPL tokens when someone contributes
    // 3. Allow token holders to claim their travel funds
    // 4. Enable trading of travel tokens
}

export default FTG_XRPL_TokenManager;