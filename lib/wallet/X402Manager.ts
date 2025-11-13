/**
 * X402 Manager
 *
 * Implements the x402 payment protocol for AI agent-to-agent payments.
 * Handles HTTP 402 Payment Required responses and automatic payment flows.
 */

import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import {
  TestnetNetwork,
  WalletErrorCode,
  LogLevel,
} from './types';
import { WalletManager } from './WalletManager';
import { TokenManager } from './TokenManager';

/**
 * x402 payment request
 */
export interface X402PaymentRequest {
  provider: string;
  endpoint: string;
  amount: string;
  currency: 'USDC';
  network: TestnetNetwork;
  invoiceId: string;
  expiry?: number;
}

/**
 * x402 payment response
 */
export interface X402PaymentResponse {
  success: boolean;
  txHash?: string;
  amount?: string;
  invoiceId?: string;
  error?: string;
  errorCode?: WalletErrorCode;
}

/**
 * x402 service configuration
 */
export interface X402ServiceConfig {
  endpoint: string;
  pricing: Record<string, string>; // path -> price
  currency: 'USDC';
  network: TestnetNetwork;
  paymentTimeout?: number;
}

/**
 * x402 payment proof
 */
export interface X402PaymentProof {
  txHash: string;
  amount: string;
  from: string;
  to: string;
  invoiceId: string;
  timestamp: number;
  verified: boolean;
}

/**
 * x402 Manager options
 */
export interface X402ManagerOptions {
  debug?: boolean;
  logLevel?: LogLevel;
  defaultNetwork?: TestnetNetwork;
  paymentTimeout?: number;
  maxRetries?: number;
}

/**
 * X402 Manager for agent payment protocol
 */
export class X402Manager extends EventEmitter {
  private walletManager: WalletManager;
  private tokenManager: TokenManager;
  private options: Required<X402ManagerOptions>;
  private pendingPayments: Map<string, X402PaymentRequest> = new Map();
  private paymentHistory: Map<string, X402PaymentProof> = new Map();
  private serviceRegistry: Map<string, X402ServiceConfig> = new Map();

  constructor(
    walletManager: WalletManager,
    options: X402ManagerOptions = {}
  ) {
    super();

    this.walletManager = walletManager;
    this.tokenManager = new TokenManager(
      walletManager.getProvider(),
      { debug: options.debug }
    );

    this.options = {
      debug: options.debug || false,
      logLevel: options.logLevel || LogLevel.INFO,
      defaultNetwork: options.defaultNetwork || TestnetNetwork.BASE_SEPOLIA,
      paymentTimeout: options.paymentTimeout || 300000, // 5 minutes
      maxRetries: options.maxRetries || 3,
    };

    this.log(LogLevel.INFO, 'X402Manager initialized');
  }

  // ========================================================================
  // Service Provider Methods (Earning)
  // ========================================================================

  /**
   * Register service as x402 provider
   */
  registerService(config: X402ServiceConfig): void {
    this.serviceRegistry.set(config.endpoint, config);
    this.log(LogLevel.INFO, `Service registered: ${config.endpoint}`);

    this.emit('serviceRegistered', {
      endpoint: config.endpoint,
      pricing: config.pricing,
    });
  }

  /**
   * Generate x402 payment request headers
   */
  generatePaymentRequest(
    path: string,
    walletAddress: string
  ): Record<string, string> {
    // Find service config
    let serviceConfig: X402ServiceConfig | undefined;
    for (const [endpoint, config] of this.serviceRegistry) {
      if (path.startsWith(endpoint)) {
        serviceConfig = config;
        break;
      }
    }

    if (!serviceConfig) {
      throw new Error(`No service registered for path: ${path}`);
    }

    // Find price for path
    const price = serviceConfig.pricing[path] || serviceConfig.pricing['*'];
    if (!price) {
      throw new Error(`No pricing found for path: ${path}`);
    }

    // Generate invoice ID
    const invoiceId = this.generateInvoiceId();

    // Calculate expiry (default 5 minutes)
    const timeout = serviceConfig.paymentTimeout || this.options.paymentTimeout;
    const expiry = Date.now() + timeout;

    // Store pending payment
    const paymentRequest: X402PaymentRequest = {
      provider: walletAddress,
      endpoint: serviceConfig.endpoint,
      amount: price,
      currency: 'USDC',
      network: serviceConfig.network,
      invoiceId,
      expiry,
    };

    this.pendingPayments.set(invoiceId, paymentRequest);

    // Emit event
    this.emit('paymentRequested', paymentRequest);

    // Return headers
    return {
      'X-402-Address': walletAddress,
      'X-402-Amount': price,
      'X-402-Currency': 'USDC',
      'X-402-Network': serviceConfig.network,
      'X-402-Invoice-ID': invoiceId,
      'X-402-Expiry': expiry.toString(),
    };
  }

  /**
   * Verify payment proof on-chain
   */
  async verifyPayment(
    txHash: string,
    expectedAmount: string,
    expectedRecipient: string,
    invoiceId: string
  ): Promise<X402PaymentProof> {
    this.log(LogLevel.INFO, `Verifying payment: ${txHash}`);

    try {
      // Get transaction from blockchain
      const tx = await this.walletManager.getTransaction(txHash);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      // Check if confirmed
      if (tx.status !== 'confirmed') {
        throw new Error('Transaction not confirmed yet');
      }

      // For USDC transfers, we need to decode the transfer data
      // USDC transfer creates a Transfer event
      const provider = this.walletManager.getProvider();
      const receipt = await provider.waitForTransaction(txHash, 1);

      // Parse USDC transfer from receipt logs
      const usdcAddress = this.tokenManager.getUSDCAddress(
        this.options.defaultNetwork
      );

      // Find Transfer event
      const transferLog = receipt.logs.find(
        (log) => log.address.toLowerCase() === usdcAddress.toLowerCase()
      );

      if (!transferLog) {
        throw new Error('No USDC transfer found in transaction');
      }

      // Decode transfer event
      const iface = new ethers.utils.Interface([
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ]);

      const decoded = iface.parseLog(transferLog);
      const transferTo = decoded.args.to;
      const transferAmount = decoded.args.value;

      // Verify recipient
      if (transferTo.toLowerCase() !== expectedRecipient.toLowerCase()) {
        throw new Error(
          `Payment sent to wrong address: ${transferTo} (expected ${expectedRecipient})`
        );
      }

      // Verify amount
      const expectedAmountWei = this.tokenManager.formatUSDCAmount(expectedAmount);
      if (transferAmount.lt(expectedAmountWei)) {
        throw new Error(
          `Insufficient payment: ${this.tokenManager.parseUSDCAmount(transferAmount)} (expected ${expectedAmount})`
        );
      }

      // Create payment proof
      const proof: X402PaymentProof = {
        txHash,
        amount: this.tokenManager.parseUSDCAmount(transferAmount),
        from: decoded.args.from,
        to: transferTo,
        invoiceId,
        timestamp: Date.now(),
        verified: true,
      };

      // Store in history
      this.paymentHistory.set(txHash, proof);

      // Remove from pending
      this.pendingPayments.delete(invoiceId);

      // Emit event
      this.emit('paymentReceived', proof);

      this.log(LogLevel.INFO, `Payment verified: ${txHash}`);

      return proof;
    } catch (error: any) {
      this.log(LogLevel.ERROR, 'Payment verification failed:', error);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Check if payment is valid and not expired
   */
  isPaymentValid(invoiceId: string): boolean {
    const payment = this.pendingPayments.get(invoiceId);
    if (!payment) {
      return false;
    }

    if (payment.expiry && payment.expiry < Date.now()) {
      this.pendingPayments.delete(invoiceId);
      return false;
    }

    return true;
  }

  // ========================================================================
  // Service Consumer Methods (Paying)
  // ========================================================================

  /**
   * Make x402-enabled HTTP request
   */
  async request(
    url: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      maxPrice?: string;
      walletAddress: string;
    }
  ): Promise<{
    status: number;
    data: any;
    paymentMade?: boolean;
    txHash?: string;
    amountPaid?: string;
  }> {
    const { method = 'GET', body, headers = {}, maxPrice, walletAddress } = options;

    this.log(LogLevel.INFO, `Making x402 request to ${url}`);

    // Initial request
    const initialHeaders = {
      ...headers,
      'X-402-Wallet': walletAddress,
    };

    let response = await this.makeHttpRequest(url, {
      method,
      body,
      headers: initialHeaders,
    });

    // If 402 Payment Required, handle payment
    if (response.status === 402) {
      this.log(LogLevel.INFO, 'Payment required, processing...');

      const paymentHeaders = response.headers as Record<string, string>;
      const requiredAmount = paymentHeaders['x-402-amount'];
      const recipientAddress = paymentHeaders['x-402-address'];
      const invoiceId = paymentHeaders['x-402-invoice-id'];
      const network = paymentHeaders['x-402-network'] as TestnetNetwork;

      // Check max price
      if (maxPrice && parseFloat(requiredAmount) > parseFloat(maxPrice)) {
        throw new Error(
          `Price too high: ${requiredAmount} USDC (max: ${maxPrice})`
        );
      }

      // Make payment
      const paymentResult = await this.makePayment({
        provider: recipientAddress,
        endpoint: url,
        amount: requiredAmount,
        currency: 'USDC',
        network: network || this.options.defaultNetwork,
        invoiceId,
      }, walletAddress);

      if (!paymentResult.success) {
        throw new Error(`Payment failed: ${paymentResult.error}`);
      }

      // Retry request with payment proof
      const retryHeaders = {
        ...initialHeaders,
        'X-402-Payment-Proof': paymentResult.txHash!,
        'X-402-Invoice-ID': invoiceId,
      };

      response = await this.makeHttpRequest(url, {
        method,
        body,
        headers: retryHeaders,
      });

      return {
        status: response.status,
        data: response.data,
        paymentMade: true,
        txHash: paymentResult.txHash,
        amountPaid: requiredAmount,
      };
    }

    return {
      status: response.status,
      data: response.data,
      paymentMade: false,
    };
  }

  /**
   * Make payment for x402 service
   */
  async makePayment(
    request: X402PaymentRequest,
    fromAddress: string
  ): Promise<X402PaymentResponse> {
    this.log(
      LogLevel.INFO,
      `Making payment: ${request.amount} USDC to ${request.provider}`
    );

    try {
      // Get wallet
      const wallets = await this.walletManager.getWalletAddresses();
      if (!wallets.includes(fromAddress)) {
        throw new Error('Wallet not found or locked');
      }

      // Unlock wallet if needed
      const signer = this.walletManager.getSigner(fromAddress);

      // Check balance
      const hasFunds = await this.tokenManager.hasSufficientUSDC(
        fromAddress,
        request.amount,
        request.network
      );

      if (!hasFunds) {
        return {
          success: false,
          error: 'Insufficient USDC balance',
          errorCode: WalletErrorCode.INSUFFICIENT_FUNDS,
        };
      }

      // Transfer USDC
      const txHash = await this.tokenManager.transferUSDC(
        signer as ethers.Wallet,
        request.provider,
        request.amount,
        request.network
      );

      this.log(LogLevel.INFO, `Payment sent: ${txHash}`);

      // Emit event
      this.emit('paymentSent', {
        txHash,
        to: request.provider,
        amount: request.amount,
        invoiceId: request.invoiceId,
      });

      return {
        success: true,
        txHash,
        amount: request.amount,
        invoiceId: request.invoiceId,
      };
    } catch (error: any) {
      this.log(LogLevel.ERROR, 'Payment failed:', error);
      return {
        success: false,
        error: error.message,
        errorCode: WalletErrorCode.TRANSACTION_FAILED,
      };
    }
  }

  // ========================================================================
  // Payment Monitoring
  // ========================================================================

  /**
   * Monitor incoming USDC payments
   */
  async monitorPayments(
    walletAddress: string,
    network?: TestnetNetwork
  ): Promise<() => void> {
    const targetNetwork = network || this.options.defaultNetwork;

    this.log(LogLevel.INFO, `Monitoring payments for ${walletAddress}`);

    const cleanup = await this.tokenManager.monitorUSDCTransfers(
      walletAddress,
      (event: any) => {
        // Only process incoming transfers
        if (event.args.to.toLowerCase() === walletAddress.toLowerCase()) {
          const amount = this.tokenManager.parseUSDCAmount(event.args.value);

          this.emit('paymentDetected', {
            txHash: event.transactionHash,
            from: event.args.from,
            to: event.args.to,
            amount,
            blockNumber: event.blockNumber,
          });

          this.log(
            LogLevel.INFO,
            `Payment detected: ${amount} USDC from ${event.args.from}`
          );
        }
      },
      targetNetwork
    );

    return cleanup;
  }

  /**
   * Get payment history
   */
  getPaymentHistory(): X402PaymentProof[] {
    return Array.from(this.paymentHistory.values());
  }

  /**
   * Get earnings report
   */
  async getEarningsReport(walletAddress: string): Promise<{
    totalEarned: string;
    paymentCount: number;
    payments: X402PaymentProof[];
  }> {
    const payments = Array.from(this.paymentHistory.values()).filter(
      (p) => p.to.toLowerCase() === walletAddress.toLowerCase()
    );

    const totalEarned = payments.reduce((sum, p) => {
      return sum + parseFloat(p.amount);
    }, 0);

    return {
      totalEarned: totalEarned.toString(),
      paymentCount: payments.length,
      payments,
    };
  }

  /**
   * Get spending report
   */
  async getSpendingReport(walletAddress: string): Promise<{
    totalSpent: string;
    paymentCount: number;
    payments: X402PaymentProof[];
  }> {
    const payments = Array.from(this.paymentHistory.values()).filter(
      (p) => p.from.toLowerCase() === walletAddress.toLowerCase()
    );

    const totalSpent = payments.reduce((sum, p) => {
      return sum + parseFloat(p.amount);
    }, 0);

    return {
      totalSpent: totalSpent.toString(),
      paymentCount: payments.length,
      payments,
    };
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Generate unique invoice ID
   */
  private generateInvoiceId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Make HTTP request (to be implemented with fetch/axios)
   */
  private async makeHttpRequest(
    url: string,
    options: {
      method: string;
      body?: any;
      headers: Record<string, string>;
    }
  ): Promise<{ status: number; data: any; headers: Record<string, string> }> {
    // This is a placeholder - in real implementation, use fetch or axios
    // For now, return mock response for testing
    this.log(LogLevel.DEBUG, `HTTP ${options.method} ${url}`);

    // In production, use:
    // const response = await fetch(url, {
    //   method: options.method,
    //   headers: options.headers,
    //   body: options.body ? JSON.stringify(options.body) : undefined,
    // });
    // return {
    //   status: response.status,
    //   data: await response.json(),
    //   headers: Object.fromEntries(response.headers.entries()),
    // };

    throw new Error('HTTP client not implemented - use in browser or with fetch polyfill');
  }

  /**
   * Log message
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level >= this.options.logLevel) {
      const prefix = `[X402Manager]`;
      switch (level) {
        case LogLevel.DEBUG:
          if (this.options.debug) console.debug(prefix, message, ...args);
          break;
        case LogLevel.INFO:
          console.info(prefix, message, ...args);
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, ...args);
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, ...args);
          break;
      }
    }
  }
}
