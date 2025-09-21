#!/bin/bash
# 🎯 FTG - Quick Test Commands for Harvard Hackathon Demo

echo "🚀 FTG - Flare Travel Goals Testing"
echo "=================================="
echo ""

echo "📋 Prerequisites Check:"
echo "✅ Node.js installed? $(node --version 2>/dev/null || echo "❌ Missing")"
echo "✅ Git installed? $(git --version 2>/dev/null | head -1 || echo "❌ Missing")"
echo "✅ Directory: $(pwd)"
echo ""

echo "🔧 Setup Commands:"
echo "==================="
echo "git clone https://github.com/DDjohnson21/Harvard-Hackathon-Sep-20th-2025.git"
echo "cd Harvard-Hackathon-Sep-20th-2025/flare-hardhat-starter"
echo "npm install"
echo "cp .env.example .env"
echo "# Edit .env file with your private key"
echo ""

echo "🧪 Test Commands (run in order):"
echo "=================================="
echo ""

echo "1️⃣ Check Contract Status:"
echo "npx hardhat run scripts/checkFTGBalance.ts --network coston2"
echo ""

echo "2️⃣ Full Demo Experience:"
echo "npx hardhat run scripts/FTG_hackathon_demo.ts --network coston2"
echo ""

echo "3️⃣ Quick Fund Withdrawal:"
echo "npx hardhat run scripts/quickWithdraw.ts --network coston2"
echo ""

echo "4️⃣ Complete Withdrawal Guide:"
echo "npx hardhat run scripts/withdrawalGuide.ts --network coston2"
echo ""

echo "🎯 Contract Info:"
echo "================="
echo "Contract Address: 0xA0285b335dEEB4127C73C9014924eDC46E70C505"
echo "Network: Flare Coston2 Testnet"
echo "Explorer: https://coston2-explorer.flare.network/address/0xA0285b335dEEB4127C73C9014924eDC46E70C505"
echo ""

echo "💰 Get Testnet Funds:"
echo "===================="
echo "Faucet: https://coston2-faucet.towolabs.com/"
echo ""

echo "🎉 Ready for Harvard Hackathon Demo!"