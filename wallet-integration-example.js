/**
 * BrowserOS Wallet Integration Example
 *
 * This file shows how to integrate the wallet library into BrowserOS.
 * Use this as a reference for your actual implementation.
 */

// ============================================================================
// 1. IMPORT THE WALLET LIBRARY
// ============================================================================

// Option A: If using as npm package
// const { WalletManager, X402Manager, TestnetNetwork } = require('@browseros/wallet');

// Option B: Direct path (for development)
const { WalletManager, X402Manager, TestnetNetwork } = require('./lib/wallet/dist/index');
const walletConfig = require('./lib/wallet/wallet-config.json');

// ============================================================================
// 2. WALLET SERVICE CLASS (for BrowserOS background script)
// ============================================================================

class BrowserOSWalletService {
  constructor() {
    this.walletManager = new WalletManager({ debug: false });
    this.x402Manager = new X402Manager(this.walletManager);
    this.currentWallet = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the wallet service and connect to network
   */
  async initialize() {
    try {
      console.log('🔧 Initializing BrowserOS Wallet Service...');

      // Connect to Base Sepolia (best for x402)
      await this.walletManager.getProvider().connect(TestnetNetwork.BASE_SEPOLIA);

      // Load existing wallet from config
      if (walletConfig && walletConfig.address) {
        this.currentWallet = walletConfig;
        console.log(`✅ Loaded wallet: ${this.currentWallet.address}`);
      }

      this.isInitialized = true;
      console.log('✅ Wallet service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize wallet service:', error);
      return false;
    }
  }

  /**
   * Get current wallet balance
   */
  async getBalance() {
    if (!this.currentWallet) {
      throw new Error('No wallet loaded');
    }

    const balance = await this.walletManager.getBalance(this.currentWallet.address);
    const balanceEth = (parseFloat(balance.toString()) / 1e18).toFixed(4);

    return {
      wei: balance.toString(),
      eth: balanceEth,
      formatted: `${balanceEth} ETH`
    };
  }

  /**
   * Get wallet information
   */
  getWalletInfo() {
    if (!this.currentWallet) {
      return null;
    }

    return {
      address: this.currentWallet.address,
      network: 'Base Sepolia',
      explorer: `https://sepolia.basescan.org/address/${this.currentWallet.address}`,
      faucet: this.currentWallet.faucetUrl
    };
  }

  /**
   * Make x402 payment for a service
   */
  async makePayment(providerAddress, amount, invoiceId) {
    if (!this.currentWallet) {
      throw new Error('No wallet loaded');
    }

    console.log(`💸 Making payment: ${amount} USDC to ${providerAddress}`);

    const payment = await this.x402Manager.makePayment(
      {
        provider: providerAddress,
        endpoint: '',
        amount: amount,
        currency: 'USDC',
        network: TestnetNetwork.BASE_SEPOLIA,
        invoiceId: invoiceId,
      },
      this.currentWallet.address
    );

    return payment;
  }

  /**
   * Register as x402 service provider
   */
  registerService(pricing) {
    this.x402Manager.registerService({
      endpoint: '/api',
      pricing: pricing,
      currency: 'USDC',
      network: TestnetNetwork.BASE_SEPOLIA,
      paymentTimeout: 300000, // 5 minutes
    });

    console.log('✅ Service registered with x402 pricing');
  }

  /**
   * Start monitoring for incoming payments
   */
  async startPaymentMonitoring(onPaymentReceived) {
    if (!this.currentWallet) {
      throw new Error('No wallet loaded');
    }

    this.x402Manager.on('paymentReceived', (payment) => {
      console.log(`✅ Payment received: ${payment.amount} USDC from ${payment.from}`);
      if (onPaymentReceived) {
        onPaymentReceived(payment);
      }
    });

    // Start monitoring
    await this.x402Manager.monitorPayments(
      this.currentWallet.address,
      TestnetNetwork.BASE_SEPOLIA
    );

    console.log('👁️ Monitoring for incoming payments...');
  }
}

// ============================================================================
// 3. USAGE EXAMPLE - BrowserOS Background Script
// ============================================================================

async function exampleBrowserOSIntegration() {
  console.log('\n' + '='.repeat(70));
  console.log('🌐 BrowserOS Wallet Integration Example');
  console.log('='.repeat(70) + '\n');

  // Initialize wallet service
  const walletService = new BrowserOSWalletService();
  await walletService.initialize();

  // Get wallet info
  const info = walletService.getWalletInfo();
  console.log('📝 Wallet Info:');
  console.log('   Address:', info.address);
  console.log('   Network:', info.network);
  console.log('   Explorer:', info.explorer);
  console.log('');

  // Get balance
  const balance = await walletService.getBalance();
  console.log('💰 Balance:', balance.formatted);
  console.log('');

  // Example 1: Register as service provider (agent that earns)
  console.log('📊 Example 1: Register as x402 Service Provider');
  walletService.registerService({
    '/api/analyze': '0.001',     // Image analysis: $0.001
    '/api/translate': '0.0005',  // Translation: $0.0005
    '/api/summarize': '0.002',   // Summarization: $0.002
  });
  console.log('   ✅ Service registered with pricing\n');

  // Start monitoring payments
  walletService.startPaymentMonitoring((payment) => {
    console.log(`   💰 Earned ${payment.amount} USDC!`);
    // Update UI, save to database, etc.
  });

  // Example 2: Make payment as consumer (agent that pays)
  console.log('📊 Example 2: Make x402 Payment (Consumer)');
  try {
    const payment = await walletService.makePayment(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Provider address
      '0.001',                                       // Amount in USDC
      `inv_${Date.now()}`                           // Invoice ID
    );

    if (payment.success) {
      console.log('   ✅ Payment successful!');
      console.log('   TX Hash:', payment.txHash);
    } else {
      console.log('   ⚠️ Payment failed:', payment.error);
    }
  } catch (error) {
    console.log('   ⚠️ Payment error (expected - need USDC):', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Integration example complete!');
  console.log('='.repeat(70) + '\n');
}

// ============================================================================
// 4. RUN EXAMPLE
// ============================================================================

if (require.main === module) {
  exampleBrowserOSIntegration().catch(console.error);
}

// ============================================================================
// 5. EXPORT FOR USE IN BROWSEROS
// ============================================================================

module.exports = {
  BrowserOSWalletService,
  exampleBrowserOSIntegration
};
