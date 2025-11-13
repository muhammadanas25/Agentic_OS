/**
 * x402 Provider Example
 *
 * This example shows how to create an AI agent that provides a service
 * and accepts x402 payments automatically.
 */

import { WalletManager, X402Manager, TestnetNetwork } from '../../index';

async function main() {
  console.log('=== x402 Provider Agent Example ===\n');

  // Step 1: Create provider wallet
  console.log('1. Setting up provider agent wallet...');
  const walletManager = new WalletManager({ debug: true });
  const wallet = await walletManager.createWallet('ProviderPass123!');

  console.log('   ✓ Provider wallet created');
  console.log(`   Address: ${wallet.address}`);
  console.log(`   This is where you'll receive payments\n`);

  // Step 2: Initialize x402 Manager
  console.log('2. Initializing x402 payment protocol...');
  const x402 = new X402Manager(walletManager);

  // Step 3: Register service
  console.log('3. Registering service...');
  x402.registerService({
    endpoint: '/api/analyze',
    pricing: {
      '/api/analyze/image': '0.001',      // $0.001 per image
      '/api/analyze/text': '0.0005',      // $0.0005 per text
      '/api/analyze/video': '0.01',       // $0.01 per video
      '*': '0.001',                       // Default price
    },
    currency: 'USDC',
    network: TestnetNetwork.BASE_SEPOLIA,
    paymentTimeout: 300000, // 5 minutes
  });

  console.log('   ✓ Service registered with pricing:');
  console.log('     - Image analysis: $0.001');
  console.log('     - Text analysis:  $0.0005');
  console.log('     - Video analysis: $0.01\n');

  // Step 4: Set up payment monitoring
  console.log('4. Starting payment monitoring...');
  const stopMonitoring = await x402.monitorPayments(
    wallet.address,
    TestnetNetwork.BASE_SEPOLIA
  );

  console.log('   ✓ Monitoring for incoming payments\n');

  // Step 5: Listen for events
  x402.on('paymentRequested', (request) => {
    console.log(`💰 Payment requested:`);
    console.log(`   Amount: ${request.amount} USDC`);
    console.log(`   Invoice: ${request.invoiceId}`);
    console.log(`   Expires: ${new Date(request.expiry!).toLocaleString()}\n`);
  });

  x402.on('paymentReceived', (proof) => {
    console.log(`✅ Payment received!`);
    console.log(`   From: ${proof.from}`);
    console.log(`   Amount: ${proof.amount} USDC`);
    console.log(`   TX: ${proof.txHash}`);
    console.log(`   Invoice: ${proof.invoiceId}\n`);

    // Here you would process the request and return the result
    console.log(`   Processing request...`);
    console.log(`   Sending response to client\n`);
  });

  // Step 6: Simulate service requests
  console.log('5. Agent is now ready to accept payments!');
  console.log('   Waiting for incoming requests...\n');

  // In a real implementation, you would:
  // 1. Start HTTP server (Express, etc.)
  // 2. Use x402.generatePaymentRequest() to create 402 responses
  // 3. Use x402.verifyPayment() to verify payments
  // 4. Process requests after payment verification

  // Example payment request simulation
  console.log('📨 Simulating payment request...\n');
  const paymentHeaders = x402.generatePaymentRequest(
    '/api/analyze/image',
    wallet.address
  );

  console.log('   Payment request headers:');
  Object.entries(paymentHeaders).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  console.log();

  // Step 7: Show earnings
  console.log('6. Checking earnings...');
  const earnings = await x402.getEarningsReport(wallet.address);
  console.log(`   Total earned: ${earnings.totalEarned} USDC`);
  console.log(`   Payment count: ${earnings.paymentCount}`);
  console.log();

  console.log('=== Provider Agent Running ===');
  console.log('Press Ctrl+C to stop\n');

  // Keep running
  process.on('SIGINT', () => {
    console.log('\n\n=== Shutting down ===');
    stopMonitoring();
    console.log('Payment monitoring stopped');
    console.log(`Final earnings: ${earnings.totalEarned} USDC`);
    process.exit(0);
  });

  // Keep process alive
  setInterval(() => {
    // Could periodically log stats here
  }, 60000);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { main };
