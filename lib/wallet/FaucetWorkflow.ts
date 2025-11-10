/**
 * Faucet Workflow
 *
 * Manages testnet token acquisition from various faucet services
 */

import {
  TestnetNetwork,
  FaucetResult,
  FaucetRequestOptions,
  FaucetRateLimit,
  FaucetConfig,
  WalletErrorCode,
  FaucetHistoryItem,
  TransactionStatus,
} from './types';
import { WalletManager } from './WalletManager';
import {
  getFaucetsForNetwork,
  getRecommendedFaucet,
  FAUCET_RETRY_CONFIG,
  FAUCET,
  ERROR_MESSAGES,
} from './config';

/**
 * Faucet workflow manager
 */
export class FaucetWorkflow {
  constructor(private walletManager: WalletManager) {}

  /**
   * Request testnet tokens from a faucet
   */
  async requestTokens(
    address: string,
    network: TestnetNetwork,
    options: FaucetRequestOptions = {}
  ): Promise<FaucetResult> {
    console.log(
      `[FaucetWorkflow] Requesting tokens for ${address} on ${network}`
    );

    // Get available faucets for network
    const faucets = getFaucetsForNetwork(network);

    if (faucets.length === 0) {
      return {
        success: false,
        error: 'No faucets available for this network',
        errorCode: WalletErrorCode.FAUCET_UNAVAILABLE,
      };
    }

    // Determine which faucet to use
    let targetFaucet: FaucetConfig;

    if (options.preferredFaucet) {
      const preferred = faucets.find((f) => f.name === options.preferredFaucet);
      targetFaucet = preferred || faucets[0];
    } else {
      targetFaucet = getRecommendedFaucet(network) || faucets[0];
    }

    // Check rate limit
    const rateLimit = await this.checkRateLimit(address, network);
    if (!rateLimit.canRequest) {
      return {
        success: false,
        error: `Rate limit exceeded. Wait ${rateLimit.waitTime} seconds.`,
        errorCode: WalletErrorCode.RATE_LIMIT_EXCEEDED,
      };
    }

    // Execute faucet request with retry logic
    const maxRetries = options.maxRetries || FAUCET_RETRY_CONFIG.maxRetries;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.executeFaucetRequest(
          address,
          network,
          targetFaucet,
          options
        );

        if (result.success) {
          // Save to faucet history
          await this.saveFaucetHistory(address, network, targetFaucet.name, result);

          // Update rate limit
          await this.updateRateLimit(address, network);

          return result;
        }

        // Try next faucet if available
        const nextFaucetIndex = faucets.indexOf(targetFaucet) + 1;
        if (nextFaucetIndex < faucets.length) {
          targetFaucet = faucets[nextFaucetIndex];
          console.log(
            `[FaucetWorkflow] Trying alternative faucet: ${targetFaucet.name}`
          );
          continue;
        }
      } catch (error: any) {
        console.error(`[FaucetWorkflow] Attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries - 1) {
          const delay = this.getRetryDelay(attempt);
          console.log(`[FaucetWorkflow] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      error: ERROR_MESSAGES.FAUCET_REQUEST_FAILED,
      errorCode: WalletErrorCode.FAUCET_REQUEST_FAILED,
    };
  }

  /**
   * Execute faucet request
   */
  private async executeFaucetRequest(
    address: string,
    _network: TestnetNetwork,
    faucet: FaucetConfig,
    _options: FaucetRequestOptions
  ): Promise<FaucetResult> {
    console.log(`[FaucetWorkflow] Requesting from ${faucet.name}...`);

    // For web-based faucets, we need to open the URL in a new tab
    // and guide the user through the process
    if (faucet.type === 'web') {
      return await this.handleWebFaucet(address, faucet);
    }

    // For API-based faucets (if we had API keys configured)
    if (faucet.type === 'api') {
      return await this.handleApiFaucet(address, faucet);
    }

    // Other faucet types would be handled here
    return {
      success: false,
      error: `Faucet type ${faucet.type} not supported yet`,
      errorCode: WalletErrorCode.FAUCET_UNAVAILABLE,
    };
  }

  /**
   * Handle web-based faucet
   */
  private async handleWebFaucet(
    address: string,
    faucet: FaucetConfig
  ): Promise<FaucetResult> {
    // Open faucet URL in new tab
    const faucetUrl = `${faucet.url}?address=${address}`;

    console.log(`[FaucetWorkflow] Opening faucet URL: ${faucetUrl}`);

    // Attempt to open in new window/tab
    if (typeof window !== 'undefined') {
      window.open(faucetUrl, '_blank');
    }

    return {
      success: true,
      faucetName: faucet.name,
      amount: faucet.amount,
      estimatedTime: 300, // 5 minutes estimate
      error: undefined,
    };
  }

  /**
   * Handle API-based faucet
   */
  private async handleApiFaucet(
    _address: string,
    _faucet: FaucetConfig
  ): Promise<FaucetResult> {
    // This would make actual API calls to faucet services
    // For now, return a placeholder
    return {
      success: false,
      error: 'API faucets require configuration',
      errorCode: WalletErrorCode.FAUCET_UNAVAILABLE,
    };
  }

  /**
   * Check if address can request from faucet (rate limiting)
   */
  async checkRateLimit(
    address: string,
    network: TestnetNetwork
  ): Promise<FaucetRateLimit> {
    const storage = this.walletManager.getStorage();
    const history = await storage.getFaucetHistory(address);

    // Find last request for this network
    const lastRequest = history
      .filter((item) => item.network === network)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!lastRequest) {
      return { canRequest: true };
    }

    // Get faucets for network to check rate limit
    const faucets = getFaucetsForNetwork(network);
    if (faucets.length === 0) {
      return { canRequest: false, waitTime: 0 };
    }

    // Use the strictest rate limit
    const rateLimitPeriod = Math.max(
      ...faucets.map((f) => f.rateLimit.period)
    );

    const timeSinceLastRequest = Date.now() - lastRequest.timestamp;
    const waitTimeMs = rateLimitPeriod * 1000 - timeSinceLastRequest;

    if (waitTimeMs > 0) {
      return {
        canRequest: false,
        waitTime: Math.ceil(waitTimeMs / 1000),
        lastRequest: lastRequest.timestamp,
      };
    }

    return {
      canRequest: true,
      lastRequest: lastRequest.timestamp,
    };
  }

  /**
   * Get time until next allowed request
   */
  async getWaitTime(
    address: string,
    network: TestnetNetwork
  ): Promise<number> {
    const rateLimit = await this.checkRateLimit(address, network);
    return rateLimit.waitTime || 0;
  }

  /**
   * Wait for faucet transaction to confirm
   */
  async waitForConfirmation(
    txHash: string,
    timeout: number = FAUCET.TRANSACTION_WAIT_TIMEOUT
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const tx = await this.walletManager.getTransaction(txHash);

        if (tx && tx.status === 'confirmed') {
          console.log(`[FaucetWorkflow] Transaction confirmed: ${txHash}`);
          return true;
        }

        if (tx && tx.status === 'failed') {
          console.error(`[FaucetWorkflow] Transaction failed: ${txHash}`);
          return false;
        }

        // Wait before next check
        await this.sleep(15000); // Check every 15 seconds
      } catch (error) {
        console.error('[FaucetWorkflow] Error checking transaction:', error);
      }
    }

    console.warn(`[FaucetWorkflow] Timeout waiting for transaction: ${txHash}`);
    return false;
  }

  /**
   * Get faucet history for address
   */
  async getFaucetHistory(address: string): Promise<FaucetHistoryItem[]> {
    const storage = this.walletManager.getStorage();
    return await storage.getFaucetHistory(address);
  }

  /**
   * Save faucet request to history
   */
  private async saveFaucetHistory(
    address: string,
    network: TestnetNetwork,
    faucetName: string,
    result: FaucetResult
  ): Promise<void> {
    const storage = this.walletManager.getStorage();

    const historyItem: FaucetHistoryItem = {
      network,
      faucetName,
      txHash: result.txHash || '',
      amount: result.amount || '0',
      timestamp: Date.now(),
      status: result.txHash ? TransactionStatus.PENDING : TransactionStatus.FAILED,
    };

    await storage.saveFaucetHistory(address, historyItem);
  }

  /**
   * Update rate limit timestamp
   */
  private async updateRateLimit(
    _address: string,
    _network: TestnetNetwork
  ): Promise<void> {
    // Rate limit is implicitly tracked via faucet history
    // The checkRateLimit method uses the history to determine if requests are allowed
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(attempt: number): number {
    const { backoff, initialDelay, maxDelay } = FAUCET_RETRY_CONFIG;

    if (backoff === 'exponential') {
      const delay = initialDelay * Math.pow(2, attempt);
      return Math.min(delay, maxDelay);
    } else {
      const delay = initialDelay * (attempt + 1);
      return Math.min(delay, maxDelay);
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
