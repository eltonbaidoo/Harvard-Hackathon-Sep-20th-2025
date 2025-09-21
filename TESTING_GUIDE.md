# 🎯 FTG - Flare Travel Goals Testing Guide

## 🚀 Quick Start for Testing

Hey! Here's how to test Elton's **FTG (Flare Travel Goals)** project - a smart contract for group travel savings with real-time price feeds!

---

## 📋 Prerequisites

1. **Node.js** installed (v16+ recommended)
2. **Git** installed
3. **MetaMask** or similar wallet
4. **Flare Coston2 testnet** setup in wallet

---

## 🔧 Setup Instructions

### Step 1: Clone and Install
```bash
# Clone the project
git clone https://github.com/DDjohnson21/Harvard-Hackathon-Sep-20th-2025.git
cd Harvard-Hackathon-Sep-20th-2025/flare-hardhat-starter

# Install dependencies
npm install
```

### Step 2: Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Edit .env file and add your private key
nano .env
# Or use any text editor to edit .env
```

**Important:** Add your Flare Coston2 testnet private key to the `.env` file:
```
PRIVATE_KEY=your_private_key_here
```

### Step 3: Get Testnet Funds
- Go to [Flare Coston2 Faucet](https://coston2-faucet.towolabs.com/)
- Enter your wallet address
- Get free testnet C2FLR tokens

---

## 🧪 Testing Commands

### 🏗️ Test 1: Check Deployment (Contract Already Deployed!)
```bash
# Check if the contract is working
npx hardhat run scripts/checkFTGBalance.ts --network coston2
```
**Expected:** Shows contract balance and info for deployed contract `0xA0285b335dEEB4127C73C9014924eDC46E70C505`

### 🎮 Test 2: Full Demo Experience
```bash
# Run the complete hackathon demo
npx hardhat run scripts/FTG_hackathon_demo.ts --network coston2
```
**Expected:** 
- Creates a new travel vault
- Shows FTSO price feeds (ETH/USD, BTC/USD, FLR/USD)
- Demonstrates fund contributions
- Shows all withdrawal methods

### 💰 Test 3: Check Balance
```bash
# Check your wallet and contract balances
npx hardhat run scripts/checkFTGBalance.ts --network coston2
```

### 🗳️ Test 4: Fund Withdrawal
```bash
# Quick withdrawal test (if funds are in contract)
npx hardhat run scripts/quickWithdraw.ts --network coston2
```

### 📊 Test 5: Complete Withdrawal Guide
```bash
# See all withdrawal methods available
npx hardhat run scripts/withdrawalGuide.ts --network coston2
```

---

## 🔍 What Each Test Shows

### 🎯 **FTG_hackathon_demo.ts** - The Main Show!
- **Creates travel vault** with 5 ETH target
- **Real FTSO price feeds** from Flare network
- **Smart fund management** with multiple release conditions
- **Group voting mechanism** for democratic fund release
- **Price trigger automation** (releases when ETH > $4000)

### 💸 **Withdrawal Scripts**
- **quickWithdraw.ts**: Fastest way to get funds back
- **withdrawalGuide.ts**: Shows all 4 withdrawal methods
- **releaseFunds.ts**: Demonstrates voting mechanism

### 📈 **Key Features to Notice**
- **Real-time price data** from Flare's FTSO
- **Multiple release conditions** (voting, price, target, emergency)
- **Gas-efficient** smart contract design
- **Group governance** with 75% consensus voting

---

## 🚨 Troubleshooting

### Problem: "Insufficient funds"
**Solution:** Get more testnet tokens from the faucet

### Problem: "Network connection"
**Solution:** Make sure you're connected to Flare Coston2 testnet

### Problem: "Contract not found"
**Solution:** The contract is already deployed at `0xA0285b335dEEB4127C73C9014924eDC46E70C505`

### Problem: "Private key error"
**Solution:** Check your `.env` file has the correct private key format

---

## 📱 Network Configuration

Add **Flare Coston2** to your wallet:
- **Network Name:** Flare Testnet Coston2
- **RPC URL:** `https://coston2-api.flare.network/ext/bc/C/rpc`
- **Chain ID:** `114`
- **Currency Symbol:** `C2FLR`
- **Block Explorer:** `https://coston2-explorer.flare.network/`

---

## 🎉 Success Indicators

✅ **Contract responds** with balance and vault info  
✅ **FTSO prices** display current ETH/USD, BTC/USD rates  
✅ **Fund contributions** work smoothly  
✅ **Voting mechanism** allows fund release  
✅ **Price triggers** show market-based automation  

---

## 🏆 Harvard Hackathon Demo Points

1. **Innovation:** Uses Flare's unique FTSO for real-world price integration
2. **Practical Use:** Solves real problem of group travel planning
3. **Technical Excellence:** Multiple smart withdrawal mechanisms
4. **User Experience:** Democratic voting with automatic market triggers
5. **Scalability:** Works for any group size and travel goal

---

## 🤝 Need Help?

- **Contract Address:** `0xA0285b335dEEB4127C73C9014924eDC46E70C505`
- **Network:** Flare Coston2 Testnet
- **Explorer:** [View on Coston2 Explorer](https://coston2-explorer.flare.network/address/0xA0285b335dEEB4127C73C9014924eDC46E70C505)

**Happy testing! This is going to be an amazing hackathon demo! 🚀**