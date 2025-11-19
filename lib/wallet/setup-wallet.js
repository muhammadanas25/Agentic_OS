/**
 * BrowserOS Wallet Setup
 *
 * This script creates a persistent wallet for BrowserOS and saves credentials securely.
 */

const { WalletManager, TestnetNetwork } = require('./dist/index');
const fs = require('fs');
const path = require('path');

async function setupWallet() {
  console.log('🚀 BrowserOS Wallet Setup\n');
  console.log('=' .repeat(60));

  const walletManager = new WalletManager({ debug: false });

  // Step 1: Create wallet
  console.log('\n📝 Step 1: Creating your BrowserOS agent wallet...');
  const password = 'BrowserOS2024!SecurePass'; // In production, use user input
  const wallet = await walletManager.createWallet(password);

  console.log('   ✅ Wallet created successfully!\n');
  console.log('   📍 Address:', wallet.address);
  console.log('   🔑 Mnemonic:', wallet.mnemonic);
  console.log('\n   ⚠️  IMPORTANT: Save your mnemonic phrase in a secure location!');
  console.log('   This is the ONLY way to recover your wallet.\n');

  // Step 2: Connect to Base Sepolia
  console.log('🌐 Step 2: Connecting to Base Sepolia testnet...');
  const provider = walletManager.getProvider();
  await provider.connect(TestnetNetwork.BASE_SEPOLIA);
  const blockNumber = await provider.getProvider().getBlockNumber();
  console.log(`   ✅ Connected! (Latest block: ${blockNumber})\n`);

  // Step 3: Check balance
  console.log('💰 Step 3: Checking wallet balance...');
  const balance = await walletManager.getBalance(wallet.address);
  console.log(`   Balance: ${balance.toString()} ETH (${parseFloat(balance.toString()) / 1e18} ETH)\n`);

  // Step 4: Save wallet info
  console.log('💾 Step 4: Saving wallet configuration...');
  const walletConfig = {
    address: wallet.address,
    mnemonic: wallet.mnemonic,
    network: 'base-sepolia',
    createdAt: new Date().toISOString(),
    password: password,
    faucetUrl: `https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet?address=${wallet.address}`,
    explorer: `https://sepolia.basescan.org/address/${wallet.address}`,
  };

  const configPath = path.join(__dirname, 'wallet-config.json');
  fs.writeFileSync(configPath, JSON.stringify(walletConfig, null, 2));
  console.log(`   ✅ Configuration saved to: ${configPath}\n`);

  // Step 5: Next steps
  console.log('=' .repeat(60));
  console.log('\n🎉 Setup Complete! Next Steps:\n');
  console.log('1. 💧 Get testnet tokens:');
  console.log(`   Visit: ${walletConfig.faucetUrl}`);
  console.log('\n2. 🔍 View your wallet:');
  console.log(`   Explorer: ${walletConfig.explorer}`);
  console.log('\n3. 🧪 Test x402 payments:');
  console.log('   Run: node dist/examples/x402/provider.js');
  console.log('\n4. 🌐 Integrate with BrowserOS:');
  console.log('   See: BrowserOS-Integration-Guide.md');
  console.log('\n' + '=' .repeat(60) + '\n');

  return walletConfig;
}

setupWallet().catch(console.error);
