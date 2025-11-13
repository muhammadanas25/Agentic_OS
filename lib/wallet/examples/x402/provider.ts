/**
 * x402 Provider Example
 *
 * This example shows how to create an AI agent that provides a service
 * and accepts x402 payments automatically.
 */

import { WalletManager, X402Manager, TestnetNetwork } from '../../index';

async function main() {
  console.log('=== x402 Provider Agent Example ===\n');
  console.log('NOTE: This example requires network connectivity to Base Sepolia testnet.');
  console.log('      For production use, ensure you have valid RPC endpoints configured.\n');

  // Step 1: Create provider wallet
  console.log('1. Setting up provider agent wallet...');
  const walletManager = new WalletManager({ debug: true });
  const wallet = await walletManager.createWallet('ProviderPass123!');

  console.log('   ✓ Provider wallet created');
  console.log(`   Address: ${wallet.address}`);
  console.log(`   This is where you'll receive payments\n`);

  // Step 2: Connect to network
  console.log('2. Connecting to Base Sepolia testnet...');
  try {
    await walletManager.getProvider().connect(TestnetNetwork.BASE_SEPOLIA);
    console.log('   ✓ Connected to Base Sepolia\n');
  } catch (error: any) {
    console.log('   ✗ Network connection failed');
    console.log('   This is expected if RPC endpoints are not configured or accessible.');
    console.log('   Continuing with offline demonstration...\n');
  }

  // Step 3: Initialize x402 Manager
  console.log('3. Initializing x402 payment protocol...');
  const x402 = new X402Manager(walletManager);

  // Step 4: Register service
  console.log('4. Registering service...');
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

  // Step 5: Set up payment monitoring
  console.log('5. Starting payment monitoring...');
  let stopMonitoring: (() => void) | null = null;
  try {
    stopMonitoring = await x402.monitorPayments(
      wallet.address,
      TestnetNetwork.BASE_SEPOLIA
    );
    console.log('   ✓ Monitoring for incoming payments\n');
  } catch (error: any) {
    console.log('   ✗ Could not start payment monitoring (network required)');
    console.log('   In production, ensure network is connected first.\n');
  }

  // Step 6: Listen for events
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

  // Step 7: Simulate service requests
  console.log('6. Agent is now ready to accept payments!');
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

  // Step 8: Show earnings
  console.log('7. Checking earnings...');
  try {
    const earnings = await x402.getEarningsReport(wallet.address);
    console.log(`   Total earned: ${earnings.totalEarned} USDC`);
    console.log(`   Payment count: ${earnings.paymentCount}`);
    console.log();
  } catch (error: any) {
    console.log('   (Earnings report requires network connectivity)');
    console.log();
  }

  console.log('=== Provider Agent Example Complete ===\n');
  console.log('This example demonstrated:');
  console.log('✅ Creating a provider wallet');
  console.log('✅ Registering an x402 service with pricing');
  console.log('✅ Generating payment request headers');
  console.log('✅ Setting up payment monitoring (requires network)');
  console.log('✅ Tracking earnings (requires network)\n');

  console.log('For production use:');
  console.log('1. Configure valid RPC endpoints in config/');
  console.log('2. Fund wallet with testnet ETH for gas');
  console.log('3. Start HTTP server with x402 middleware');
  console.log('4. Monitor payments in real-time\n');

  if (stopMonitoring) {
    // Keep running
    console.log('Press Ctrl+C to stop monitoring\n');
    process.on('SIGINT', () => {
      console.log('\n\n=== Shutting down ===');
      if (stopMonitoring) {
        stopMonitoring();
        console.log('Payment monitoring stopped');
      }
      process.exit(0);
    });

    // Keep process alive
    setInterval(() => {
      // Could periodically log stats here
    }, 60000);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { main };
