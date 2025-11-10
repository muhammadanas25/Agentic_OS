/**
 * Example usage of BrowserOS Wallet
 *
 * This file demonstrates the basic workflow for:
 * 1. Creating a wallet
 * 2. Requesting testnet tokens from a faucet
 * 3. Checking balance
 * 4. Sending a transaction
 */

import { WalletManager, FaucetWorkflow, TestnetNetwork } from './index';

async function main() {
  console.log('=== BrowserOS Wallet Example ===\n');

  // Step 1: Initialize Wallet Manager
  console.log('1. Initializing Wallet Manager...');
  const walletManager = new WalletManager({
    debug: true,
  });
  console.log('   ✓ Wallet Manager initialized\n');

  // Step 2: Create a new wallet
  console.log('2. Creating a new wallet...');
  const password = 'MySecurePassword123!';
  const wallet = await walletManager.createWallet(password);

  console.log('   ✓ Wallet created!');
  console.log('   Address:', wallet.address);
  console.log('   Mnemonic:', wallet.mnemonic);
  console.log('   ⚠️  SAVE YOUR MNEMONIC PHRASE SECURELY!\n');

  // Step 3: Connect to Sepolia testnet
  console.log('3. Connecting to Sepolia testnet...');
  await walletManager.switchNetwork(TestnetNetwork.SEPOLIA);
  console.log('   ✓ Connected to Sepolia\n');

  // Step 4: Request testnet tokens from faucet
  console.log('4. Requesting testnet ETH from faucet...');
  const faucet = new FaucetWorkflow(walletManager);

  const faucetResult = await faucet.requestTokens(
    wallet.address,
    TestnetNetwork.SEPOLIA
  );

  if (faucetResult.success) {
    console.log('   ✓ Faucet request successful!');
    console.log('   Faucet:', faucetResult.faucetName);
    console.log('   Expected amount:', faucetResult.amount, 'ETH');

    if (faucetResult.txHash) {
      console.log('   Transaction:', faucetResult.txHash);

      // Wait for confirmation
      console.log('   ⏳ Waiting for confirmation...');
      await faucet.waitForConfirmation(faucetResult.txHash);
      console.log('   ✓ Tokens received!\n');
    } else {
      console.log('   ℹ️  Please complete the faucet request manually\n');
    }
  } else {
    console.log('   ✗ Faucet request failed:', faucetResult.error);
    console.log('   ℹ️  You can request manually from: https://sepoliafaucet.com\n');
  }

  // Step 5: Check balance
  console.log('5. Checking wallet balance...');
  const balance = await walletManager.getFormattedBalance(wallet.address);
  console.log('   Balance:', balance.formatted, balance.symbol);
  console.log('   Network:', balance.network);
  console.log('   Last updated:', new Date(balance.lastUpdated).toLocaleString(), '\n');

  // Step 6: Send a transaction (if balance > 0)
  const balanceInEth = parseFloat(balance.formatted);
  if (balanceInEth > 0.001) {
    console.log('6. Sending a test transaction...');

    // Example: send 0.001 ETH to another address
    const recipientAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const amountToSend = '0.001';

    console.log('   To:', recipientAddress);
    console.log('   Amount:', amountToSend, 'ETH');

    try {
      const txHash = await walletManager.sendTransaction({
        from: wallet.address,
        to: recipientAddress,
        value: amountToSend,
        network: TestnetNetwork.SEPOLIA,
      });

      console.log('   ✓ Transaction sent!');
      console.log('   Hash:', txHash);

      // Wait for confirmation
      console.log('   ⏳ Waiting for confirmation...');
      const receipt = await walletManager.waitForTransaction(txHash);

      console.log('   ✓ Transaction confirmed!');
      console.log('   Block:', receipt.blockNumber);
      console.log('   Gas used:', receipt.gasUsed);
      console.log('   Status:', receipt.status === 1 ? 'Success' : 'Failed', '\n');
    } catch (error: any) {
      console.log('   ✗ Transaction failed:', error.message, '\n');
    }
  } else {
    console.log('6. Skipping transaction (insufficient balance)\n');
  }

  // Step 7: Get transaction history
  console.log('7. Getting transaction history...');
  const history = await walletManager.getTransactionHistory(wallet.address);

  if (history.length > 0) {
    console.log(`   Found ${history.length} transaction(s):`);
    history.forEach((tx, i) => {
      console.log(`   ${i + 1}. ${tx.hash.substring(0, 10)}... (${tx.type}, ${tx.status})`);
    });
  } else {
    console.log('   No transactions yet');
  }
  console.log();

  // Step 8: Get balances across all networks
  console.log('8. Checking balances across all networks...');
  const allBalances = await walletManager.getAllBalances(wallet.address);

  for (const [network, bal] of Object.entries(allBalances)) {
    console.log(`   ${network}: ${bal.formatted} ${bal.symbol}`);
  }
  console.log();

  console.log('=== Example Complete ===');
  console.log('\n📚 Next steps:');
  console.log('   - Save your mnemonic phrase securely');
  console.log('   - Request more testnet tokens if needed');
  console.log('   - Explore other networks (Mumbai, Arbitrum, etc.)');
  console.log('   - Build your dApp using this wallet!');
}

// Run the example
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { main };
