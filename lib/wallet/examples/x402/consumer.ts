/**
 * x402 Consumer Example
 *
 * This example shows how to create an AI agent that consumes services
 * and pays automatically using x402.
 */

import { WalletManager, X402Manager, FaucetWorkflow, TestnetNetwork } from '../../index';

async function main() {
  console.log('=== x402 Consumer Agent Example ===\n');

  // Step 1: Create consumer wallet
  console.log('1. Setting up consumer agent wallet...');
  const walletManager = new WalletManager({ debug: true });
  const wallet = await walletManager.createWallet('ConsumerPass123!');

  console.log('   ✓ Consumer wallet created');
  console.log(`   Address: ${wallet.address}\n`);

  // Step 2: Get testnet USDC
  console.log('2. Getting testnet USDC...');
  console.log('   (In production, fund with real USDC)');

  const faucet = new FaucetWorkflow(walletManager);

  // First get testnet ETH for gas
  console.log('   Requesting testnet ETH for gas...');
  await faucet.requestTokens(wallet.address, TestnetNetwork.BASE_SEPOLIA);
  console.log('   ✓ Testnet ETH requested\n');

  // Note: For USDC, you would typically:
  // 1. Buy USDC on mainnet
  // 2. Bridge to Base
  // Or for testnet:
  // 1. Use a USDC faucet (if available)
  // 2. Or get from Circle's testnet faucet

  console.log('   For this example, assume wallet has USDC\n');

  // Step 3: Initialize x402 Manager
  console.log('3. Initializing x402 payment client...');
  const x402 = new X402Manager(walletManager);
  console.log('   ✓ x402 client ready\n');

  // Step 4: Listen for payment events
  x402.on('paymentSent', (payment) => {
    console.log(`💸 Payment sent:`);
    console.log(`   To: ${payment.to}`);
    console.log(`   Amount: ${payment.amount} USDC`);
    console.log(`   TX: ${payment.txHash}`);
    console.log(`   Invoice: ${payment.invoiceId}\n`);
  });

  // Step 5: Make x402-enabled service requests
  console.log('4. Making service requests...\n');

  // Simulate discovering a service
  const serviceUrl = 'https://image-analysis-agent.com/api/analyze';
  const serviceWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'; // Example

  console.log(`   Discovered service: ${serviceUrl}`);
  console.log(`   Provider wallet: ${serviceWallet}\n`);

  // Example 1: Image analysis
  console.log('   📸 Request 1: Analyze image');
  try {
    // This would make the actual HTTP request in production
    // For now, simulate the payment
    const payment1 = await x402.makePayment(
      {
        provider: serviceWallet,
        endpoint: serviceUrl,
        amount: '0.001',
        currency: 'USDC',
        network: TestnetNetwork.BASE_SEPOLIA,
        invoiceId: 'inv_example_1',
      },
      wallet.address
    );

    if (payment1.success) {
      console.log('   ✓ Payment successful');
      console.log('   Service would return: { result: "cat detected" }\n');
    } else {
      console.log(`   ✗ Payment failed: ${payment1.error}\n`);
    }
  } catch (error: any) {
    console.log(`   ✗ Error: ${error.message}\n`);
  }

  // Example 2: Text analysis
  console.log('   📝 Request 2: Analyze text');
  try {
    const payment2 = await x402.makePayment(
      {
        provider: serviceWallet,
        endpoint: serviceUrl,
        amount: '0.0005',
        currency: 'USDC',
        network: TestnetNetwork.BASE_SEPOLIA,
        invoiceId: 'inv_example_2',
      },
      wallet.address
    );

    if (payment2.success) {
      console.log('   ✓ Payment successful');
      console.log('   Service would return: { sentiment: "positive" }\n');
    } else {
      console.log(`   ✗ Payment failed: ${payment2.error}\n`);
    }
  } catch (error: any) {
    console.log(`   ✗ Error: ${error.message}\n`);
  }

  // Step 6: Show spending report
  console.log('5. Checking spending...');
  const spending = await x402.getSpendingReport(wallet.address);
  console.log(`   Total spent: ${spending.totalSpent} USDC`);
  console.log(`   Transactions: ${spending.paymentCount}`);

  if (spending.payments.length > 0) {
    console.log('\n   Payment history:');
    spending.payments.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.amount} USDC to ${p.to.substring(0, 10)}...`);
      console.log(`      TX: ${p.txHash}`);
    });
  }
  console.log();

  // Step 7: Show how to use in production
  console.log('6. Production usage example:\n');
  console.log('   ```typescript');
  console.log('   // Automatic payment handling');
  console.log('   const result = await x402.request(serviceUrl, {');
  console.log('     method: "POST",');
  console.log('     body: { image: imageData },');
  console.log('     maxPrice: "0.01",  // Won\'t pay more than this');
  console.log('     walletAddress: wallet.address');
  console.log('   });');
  console.log('');
  console.log('   if (result.paymentMade) {');
  console.log('     console.log(`Paid ${result.amountPaid} USDC`);');
  console.log('   }');
  console.log('   console.log(result.data);  // Service response');
  console.log('   ```\n');

  console.log('=== Consumer Agent Example Complete ===');
  console.log('\nKey takeaways:');
  console.log('✅ Agents can discover and pay for services automatically');
  console.log('✅ Payments happen seamlessly in the background');
  console.log('✅ Full transparency with spending reports');
  console.log('✅ Maximum price protection built-in\n');
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { main };
