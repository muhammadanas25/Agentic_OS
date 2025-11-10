/**
 * Testnet Provider
 *
 * Manages RPC connections to testnet networks and provides methods
 * for interacting with the blockchain.
 */

import { ethers, BigNumber } from 'ethers';
import {
  ITestnetProvider,
  TestnetNetwork,
  ProviderOptions,
  NetworkStats,
  GasPrice,
  Transaction,
  TransactionReceipt,
  TransactionParams,
  WalletErrorCode,
  NetworkConfig,
} from './types';
import {
  getNetworkConfig,
  getAlternativeRpcUrls,
  RPC,
  TRANSACTION,
  NETWORK_RETRY_CONFIG,
} from './config';

/**
 * Testnet provider implementation
 */
export class TestnetProvider implements ITestnetProvider {
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private currentNetwork: TestnetNetwork | null = null;
  private options: Required<ProviderOptions>;
  private retryCount: Map<string, number> = new Map();

  constructor(options: ProviderOptions & { debug?: boolean } = {}) {
    this.options = {
      timeout: options.timeout || RPC.TIMEOUT,
      pollingInterval: options.pollingInterval || RPC.POLLING_INTERVAL,
      maxRetries: options.maxRetries || RPC.MAX_RETRIES,
      customHeaders: options.customHeaders || {},
    };
  }

  // ========================================================================
  // Connection Management
  // ========================================================================

  /**
   * Connect to a testnet network
   */
  async connect(
    network: TestnetNetwork,
    options?: ProviderOptions
  ): Promise<void> {
    const networkConfig = getNetworkConfig(network);
    const rpcUrl = options?.customHeaders
      ? networkConfig.rpcUrl
      : this.getRpcUrl(networkConfig);

    console.log(`[TestnetProvider] Connecting to ${network}...`);

    try {
      // Create provider
      this.provider = new ethers.providers.JsonRpcProvider({
        url: rpcUrl,
        timeout: this.options.timeout,
        headers: this.options.customHeaders,
      });

      // Set polling interval
      this.provider.pollingInterval = this.options.pollingInterval;

      // Verify connection
      const blockNumber = await this.provider.getBlockNumber();
      const actualChainId = (await this.provider.getNetwork()).chainId;

      if (actualChainId !== networkConfig.chainId) {
        throw new Error(
          `Chain ID mismatch: expected ${networkConfig.chainId}, got ${actualChainId}`
        );
      }

      this.currentNetwork = network;
      console.log(
        `[TestnetProvider] Connected to ${network} (block: ${blockNumber})`
      );
    } catch (error: any) {
      console.error(`[TestnetProvider] Connection failed:`, error);

      // Try alternative RPC URLs
      const alternatives = getAlternativeRpcUrls(network);
      for (const altUrl of alternatives) {
        if (altUrl === rpcUrl) continue; // Skip the one we just tried

        try {
          console.log(`[TestnetProvider] Trying alternative RPC: ${altUrl}`);
          this.provider = new ethers.providers.JsonRpcProvider(altUrl);
          await this.provider.getBlockNumber();
          this.currentNetwork = network;
          console.log(
            `[TestnetProvider] Connected using alternative RPC`
          );
          return;
        } catch (altError) {
          continue;
        }
      }

      throw new Error(`Failed to connect to ${network}: ${error.message}`);
    }
  }

  /**
   * Disconnect from current network
   */
  async disconnect(): Promise<void> {
    if (this.provider) {
      // JsonRpcProvider doesn't have explicit disconnect
      this.provider = null;
      this.currentNetwork = null;
      console.log('[TestnetProvider] Disconnected');
    }
  }

  /**
   * Get current network
   */
  getCurrentNetwork(): TestnetNetwork | null {
    return this.currentNetwork;
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(network: TestnetNetwork): NetworkConfig {
    return getNetworkConfig(network);
  }

  /**
   * Get the current provider instance
   */
  getProvider(): ethers.providers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Provider not connected. Call connect() first.');
    }
    return this.provider;
  }

  // ========================================================================
  // Blockchain Queries
  // ========================================================================

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.retry(async () => {
      this.ensureConnected();
      return await this.provider!.getBlockNumber();
    });
  }

  /**
   * Get gas price information
   */
  async getGasPrice(): Promise<GasPrice> {
    return await this.retry(async () => {
      this.ensureConnected();

      // Try to get EIP-1559 gas prices
      try {
        const feeData = await this.provider!.getFeeData();

        return {
          slow: feeData.gasPrice || BigNumber.from(0),
          average: feeData.gasPrice || BigNumber.from(0),
          fast: feeData.gasPrice || BigNumber.from(0),
          baseFee: feeData.lastBaseFeePerGas || undefined,
          maxPriorityFeePerGas:
            feeData.maxPriorityFeePerGas || undefined,
        };
      } catch (error) {
        // Fallback to legacy gas price
        const gasPrice = await this.provider!.getGasPrice();
        return {
          slow: gasPrice.mul(80).div(100), // 80% of current
          average: gasPrice,
          fast: gasPrice.mul(120).div(100), // 120% of current
        };
      }
    });
  }

  /**
   * Get balance for an address
   */
  async getBalance(address: string): Promise<BigNumber> {
    return await this.retry(async () => {
      this.ensureConnected();
      return await this.provider!.getBalance(address);
    });
  }

  /**
   * Get transaction count (nonce) for an address
   */
  async getTransactionCount(address: string): Promise<number> {
    return await this.retry(async () => {
      this.ensureConnected();
      return await this.provider!.getTransactionCount(address, 'latest');
    });
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: Partial<TransactionParams>): Promise<BigNumber> {
    return await this.retry(async () => {
      this.ensureConnected();

      const estimateTx = {
        from: tx.from,
        to: tx.to,
        value: tx.value ? ethers.utils.parseEther(tx.value) : undefined,
        data: tx.data,
      };

      const estimate = await this.provider!.estimateGas(estimateTx);

      // Add buffer
      return estimate.mul(Math.floor(TRANSACTION.GAS_LIMIT_BUFFER * 100)).div(100);
    });
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string): Promise<Transaction | null> {
    return await this.retry(async () => {
      this.ensureConnected();

      const tx = await this.provider!.getTransaction(txHash);
      if (!tx) return null;

      const receipt = await this.provider!.getTransactionReceipt(txHash);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: ethers.utils.formatEther(tx.value),
        gasLimit: tx.gasLimit.toNumber(),
        gasPrice: tx.gasPrice ? ethers.utils.formatUnits(tx.gasPrice, 'gwei') : undefined,
        maxFeePerGas: tx.maxFeePerGas
          ? ethers.utils.formatUnits(tx.maxFeePerGas, 'gwei')
          : undefined,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas
          ? ethers.utils.formatUnits(tx.maxPriorityFeePerGas, 'gwei')
          : undefined,
        nonce: tx.nonce,
        data: tx.data,
        chainId: tx.chainId,
        status: receipt
          ? receipt.status === 1
            ? 'confirmed' as const
            : 'failed' as const
          : 'pending' as const,
        blockNumber: tx.blockNumber || undefined,
        blockHash: tx.blockHash || undefined,
        timestamp: Date.now(),
        confirmations: tx.confirmations,
        network: this.currentNetwork!,
      };
    });
  }

  /**
   * Send raw signed transaction
   */
  async sendRawTransaction(signedTx: string): Promise<string> {
    return await this.retry(async () => {
      this.ensureConnected();

      const tx = await this.provider!.sendTransaction(signedTx);
      return tx.hash;
    });
  }

  /**
   * Wait for transaction to be mined
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = TRANSACTION.CONFIRMATION_BLOCKS
  ): Promise<TransactionReceipt> {
    this.ensureConnected();

    console.log(
      `[TestnetProvider] Waiting for transaction ${txHash} (${confirmations} confirmations)...`
    );

    const receipt = await this.provider!.waitForTransaction(
      txHash,
      confirmations,
      TRANSACTION.MAX_CONFIRMATION_WAIT
    );

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      from: receipt.from,
      to: receipt.to || '',
      gasUsed: receipt.gasUsed.toString(),
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice?.toString() || '0',
      status: receipt.status || 0,
      logs: receipt.logs.map((log) => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
      })),
      contractAddress: receipt.contractAddress || undefined,
    };
  }

  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<NetworkStats> {
    this.ensureConnected();

    const [blockNumber, gasPrice, network] = await Promise.all([
      this.getBlockNumber(),
      this.getGasPrice(),
      this.provider!.getNetwork(),
    ]);

    return {
      blockNumber,
      gasPrice,
      chainId: network.chainId,
      networkName: network.name,
      lastUpdated: Date.now(),
    };
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Ensure provider is connected
   */
  private ensureConnected(): void {
    if (!this.provider || !this.currentNetwork) {
      throw new Error('Provider not connected. Call connect() first.');
    }
  }

  /**
   * Get RPC URL (replace API key placeholders if needed)
   */
  private getRpcUrl(config: NetworkConfig): string {
    let url = config.rpcUrl;

    // Replace API key placeholders with environment variables
    if (url.includes('YOUR_INFURA_KEY')) {
      const infuraKey = process.env.INFURA_API_KEY || '';
      url = url.replace('YOUR_INFURA_KEY', infuraKey);
    }

    if (url.includes('YOUR_ALCHEMY_KEY')) {
      const alchemyKey = process.env.ALCHEMY_API_KEY || '';
      url = url.replace('YOUR_ALCHEMY_KEY', alchemyKey);
    }

    return url;
  }

  /**
   * Retry wrapper for RPC calls
   */
  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    const key = fn.toString().substring(0, 50);
    let lastError: Error | undefined;

    for (
      let attempt = 0;
      attempt <= NETWORK_RETRY_CONFIG.maxRetries;
      attempt++
    ) {
      try {
        const result = await fn();
        this.retryCount.delete(key);
        return result;
      } catch (error: any) {
        lastError = error;

        if (attempt < NETWORK_RETRY_CONFIG.maxRetries) {
          const delay = this.getRetryDelay(attempt);
          console.warn(
            `[TestnetProvider] Retry ${attempt + 1}/${NETWORK_RETRY_CONFIG.maxRetries} after ${delay}ms`
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(attempt: number): number {
    const { backoff, initialDelay, maxDelay } = NETWORK_RETRY_CONFIG;

    if (backoff === 'exponential') {
      const delay = initialDelay * Math.pow(2, attempt);
      return Math.min(delay, maxDelay);
    } else {
      // Linear backoff
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
