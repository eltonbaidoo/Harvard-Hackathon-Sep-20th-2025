#!/bin/bash

# Flare Hackathon Virtual Environment Setup
echo "🚀 Setting up Flare Hackathon Virtual Environment..."

# Load nvm if it exists
if [ -f ~/.nvm/nvm.sh ]; then
    source ~/.nvm/nvm.sh
elif [ -f /usr/local/opt/nvm/nvm.sh ]; then
    source /usr/local/opt/nvm/nvm.sh
fi

# Use the Node.js version specified in .nvmrc
echo "📦 Using Node.js version from .nvmrc..."
nvm use

# Show current environment
echo ""
echo "✅ Virtual Environment Ready!"
echo "   Node.js: $(node --version)"
echo "   NPM: $(npm --version)"
echo "   Working Directory: $(pwd)"
echo ""
echo "🎯 Available Commands:"
echo "   yarn hardhat compile              - Compile smart contracts"
echo "   yarn hardhat run scripts/HelloWorld.ts --network coston2"
echo "   yarn hardhat run scripts/FTG_hackathon_demo.ts --network coston2"
echo "   yarn hardhat run scripts/GuessingGame.ts --network coston2"
echo ""
echo "🌐 Available Networks:"
echo "   coston2   - Flare testnet (recommended)"
echo "   coston    - Flare testnet"
echo "   songbird  - Flare canary"
echo "   flare     - Flare mainnet"
echo ""
echo "💡 Tip: Exit this environment with 'nvm deactivate'"
echo ""

# Start a new shell with the environment
exec "$SHELL"
