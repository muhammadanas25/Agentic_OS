/**
 * Token Manager
 *
 * Handles ERC-20 token operations including USDC for x402 payments
 */

import { ethers, BigNumber } from 'ethers';
import {
  Token,
  TokenBalance,
  TestnetNetwork,
  WalletErrorCode,
  LogLevel,
} from './types';
import { TestnetProvider } from './TestnetProvider';

// Standard ERC-20 ABI (minimal interface)
const ERC20_ABI = [
  // Read functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',

  // Write functions
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

/**
 * USDC contract addresses on different networks
 */
export const USDC_ADDRESSES: Record<TestnetNetwork, string> = {
  [TestnetNetwork.SEPOLIA]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  [TestnetNetwork.GOERLI]: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
  [TestnetNetwork.MUMBAI]: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',
  [TestnetNetwork.ARBITRUM_SEPOLIA]: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  [TestnetNetwork.OPTIMISM_SEPOLIA]: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
  [TestnetNetwork.BASE_SEPOLIA]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

/**
 * Token metadata
 */
export const TOKEN_METADATA = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6, // USDC has 6 decimals (not 18 like most tokens)
  },
};

/**
 * Token manager options
 */
export interface TokenManagerOptions {
  debug?: boolean;
  logLevel?: LogLevel;
}

/**
 * Token manager for ERC-20 tokens
 */
export class TokenManager {
  private provider: TestnetProvider;
  private options: Required<TokenManagerOptions>;
  private tokenCache: Map<string, ethers.Contract> = new Map();

  constructor(provider: TestnetProvider, options: TokenManagerOptions = {}) {
    this.provider = provider;
    this.options = {
      debug: options.debug || false,
      logLevel: options.logLevel || LogLevel.INFO,
    };
  }

  // ========================================================================
  // Token Information
  // ========================================================================

  /**
   * Get USDC contract for current network
   */
  getUSDCContract(network: TestnetNetwork): ethers.Contract {
    const address = USDC_ADDRESSES[network];
    if (!address) {
      throw new Error(`USDC not available on ${network}`);
    }

    const cacheKey = `usdc-${network}`;
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey)!;
    }

    const contract = new ethers.Contract(
      address,
      ERC20_ABI,
      this.provider.getProvider()
    );

    this.tokenCache.set(cacheKey, contract);
    return contract;
  }

  /**
   * Get any ERC-20 token contract
   */
  getTokenContract(address: string): ethers.Contract {
    if (this.tokenCache.has(address)) {
      return this.tokenCache.get(address)!;
    }

    const contract = new ethers.Contract(
      address,
      ERC20_ABI,
      this.provider.getProvider()
    );

    this.tokenCache.set(address, contract);
    return contract;
  }

  /**
   * Get token metadata
   */
  async getTokenInfo(tokenAddress: string): Promise<Token> {
    const contract = this.getTokenContract(tokenAddress);
    const network = this.provider.getCurrentNetwork();

    if (!network) {
      throw new Error('No network connected');
    }

    try {
      const [symbol, name, decimals] = await Promise.all([
        contract.symbol(),
        contract.name(),
        contract.decimals(),
      ]);

      return {
        address: tokenAddress,
        symbol,
        name,
        decimals,
        network,
      };
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to get token info:', error);
      throw new Error(`Failed to get token info: ${error}`);
    }
  }

  // ========================================================================
  // Balance Operations
  // ========================================================================

  /**
   * Get USDC balance for address
   */
  async getUSDCBalance(
    address: string,
    network?: TestnetNetwork
  ): Promise<BigNumber> {
    const targetNetwork = network || this.provider.getCurrentNetwork();
    if (!targetNetwork) {
      throw new Error('No network connected');
    }

    // Switch network if needed
    if (network && network !== this.provider.getCurrentNetwork()) {
      await this.provider.connect(network);
    }

    const contract = this.getUSDCContract(targetNetwork);

    try {
      const balance = await contract.balanceOf(address);
      this.log(
        LogLevel.DEBUG,
        `USDC balance for ${address}: ${balance.toString()}`
      );
      return balance;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to get USDC balance:', error);
      throw new Error(`Failed to get USDC balance: ${error}`);
    }
  }

  /**
   * Get formatted USDC balance (with decimals)
   */
  async getFormattedUSDCBalance(
    address: string,
    network?: TestnetNetwork
  ): Promise<string> {
    const balance = await this.getUSDCBalance(address, network);
    // USDC has 6 decimals
    return ethers.utils.formatUnits(balance, 6);
  }

  /**
   * Get token balance for any ERC-20 token
   */
  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string
  ): Promise<TokenBalance> {
    const contract = this.getTokenContract(tokenAddress);

    try {
      const [balance, tokenInfo] = await Promise.all([
        contract.balanceOf(walletAddress),
        this.getTokenInfo(tokenAddress),
      ]);

      return {
        token: tokenInfo,
        balance,
        formattedBalance: ethers.utils.formatUnits(balance, tokenInfo.decimals),
      };
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to get token balance:', error);
      throw new Error(`Failed to get token balance: ${error}`);
    }
  }

  // ========================================================================
  // Transfer Operations
  // ========================================================================

  /**
   * Transfer USDC tokens
   */
  async transferUSDC(
    wallet: ethers.Wallet,
    to: string,
    amount: string,
    network?: TestnetNetwork
  ): Promise<string> {
    const targetNetwork = network || this.provider.getCurrentNetwork();
    if (!targetNetwork) {
      throw new Error('No network connected');
    }

    // Switch network if needed
    if (network && network !== this.provider.getCurrentNetwork()) {
      await this.provider.connect(network);
    }

    const contract = this.getUSDCContract(targetNetwork);
    const connectedContract = contract.connect(
      wallet.connect(this.provider.getProvider())
    );

    // Convert amount to USDC units (6 decimals)
    const amountInUnits = ethers.utils.parseUnits(amount, 6);

    this.log(
      LogLevel.INFO,
      `Transferring ${amount} USDC to ${to} on ${targetNetwork}`
    );

    try {
      const tx = await connectedContract.transfer(to, amountInUnits);
      this.log(LogLevel.INFO, `Transaction sent: ${tx.hash}`);
      return tx.hash;
    } catch (error: any) {
      this.log(LogLevel.ERROR, 'Transfer failed:', error);

      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw {
          code: WalletErrorCode.INSUFFICIENT_FUNDS,
          message: 'Insufficient USDC balance',
          details: error,
        };
      }

      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Transfer any ERC-20 token
   */
  async transferToken(
    wallet: ethers.Wallet,
    tokenAddress: string,
    to: string,
    amount: string
  ): Promise<string> {
    const tokenInfo = await this.getTokenInfo(tokenAddress);
    const contract = this.getTokenContract(tokenAddress);
    const connectedContract = contract.connect(
      wallet.connect(this.provider.getProvider())
    );

    // Convert amount to token units
    const amountInUnits = ethers.utils.parseUnits(amount, tokenInfo.decimals);

    this.log(
      LogLevel.INFO,
      `Transferring ${amount} ${tokenInfo.symbol} to ${to}`
    );

    try {
      const tx = await connectedContract.transfer(to, amountInUnits);
      this.log(LogLevel.INFO, `Transaction sent: ${tx.hash}`);
      return tx.hash;
    } catch (error: any) {
      this.log(LogLevel.ERROR, 'Transfer failed:', error);
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  // ========================================================================
  // Approval Operations (for DeFi/x402)
  // ========================================================================

  /**
   * Approve USDC spending
   */
  async approveUSDC(
    wallet: ethers.Wallet,
    spender: string,
    amount: string,
    network?: TestnetNetwork
  ): Promise<string> {
    const targetNetwork = network || this.provider.getCurrentNetwork();
    if (!targetNetwork) {
      throw new Error('No network connected');
    }

    if (network && network !== this.provider.getCurrentNetwork()) {
      await this.provider.connect(network);
    }

    const contract = this.getUSDCContract(targetNetwork);
    const connectedContract = contract.connect(
      wallet.connect(this.provider.getProvider())
    );

    // Convert amount to USDC units (6 decimals)
    const amountInUnits = ethers.utils.parseUnits(amount, 6);

    this.log(
      LogLevel.INFO,
      `Approving ${amount} USDC for ${spender} on ${targetNetwork}`
    );

    try {
      const tx = await connectedContract.approve(spender, amountInUnits);
      this.log(LogLevel.INFO, `Approval transaction sent: ${tx.hash}`);
      return tx.hash;
    } catch (error: any) {
      this.log(LogLevel.ERROR, 'Approval failed:', error);
      throw new Error(`Approval failed: ${error.message}`);
    }
  }

  /**
   * Check USDC allowance
   */
  async getUSDCAllowance(
    owner: string,
    spender: string,
    network?: TestnetNetwork
  ): Promise<BigNumber> {
    const targetNetwork = network || this.provider.getCurrentNetwork();
    if (!targetNetwork) {
      throw new Error('No network connected');
    }

    const contract = this.getUSDCContract(targetNetwork);

    try {
      const allowance = await contract.allowance(owner, spender);
      return allowance;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to get allowance:', error);
      throw new Error(`Failed to get allowance: ${error}`);
    }
  }

  // ========================================================================
  // Event Monitoring
  // ========================================================================

  /**
   * Monitor USDC transfers
   */
  async monitorUSDCTransfers(
    address: string,
    callback: (event: any) => void,
    network?: TestnetNetwork
  ): Promise<() => void> {
    const targetNetwork = network || this.provider.getCurrentNetwork();
    if (!targetNetwork) {
      throw new Error('No network connected');
    }

    const contract = this.getUSDCContract(targetNetwork);

    // Filter for transfers to or from the address
    const filterTo = contract.filters.Transfer(null, address);
    const filterFrom = contract.filters.Transfer(address, null);

    this.log(LogLevel.INFO, `Monitoring USDC transfers for ${address}`);

    contract.on(filterTo, callback);
    contract.on(filterFrom, callback);

    // Return cleanup function
    return () => {
      contract.off(filterTo, callback);
      contract.off(filterFrom, callback);
      this.log(LogLevel.INFO, `Stopped monitoring USDC transfers for ${address}`);
    };
  }

  /**
   * Get past USDC transfers
   */
  async getUSDCTransferHistory(
    address: string,
    fromBlock: number = 0,
    network?: TestnetNetwork
  ): Promise<any[]> {
    const targetNetwork = network || this.provider.getCurrentNetwork();
    if (!targetNetwork) {
      throw new Error('No network connected');
    }

    const contract = this.getUSDCContract(targetNetwork);

    try {
      // Get transfers to address
      const receivedFilter = contract.filters.Transfer(null, address);
      const received = await contract.queryFilter(receivedFilter, fromBlock);

      // Get transfers from address
      const sentFilter = contract.filters.Transfer(address, null);
      const sent = await contract.queryFilter(sentFilter, fromBlock);

      // Combine and sort by block number
      const allTransfers = [...received, ...sent].sort(
        (a, b) => a.blockNumber - b.blockNumber
      );

      return allTransfers;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to get transfer history:', error);
      throw new Error(`Failed to get transfer history: ${error}`);
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Parse USDC amount from wei
   */
  parseUSDCAmount(amount: BigNumber): string {
    return ethers.utils.formatUnits(amount, 6);
  }

  /**
   * Format USDC amount to wei
   */
  formatUSDCAmount(amount: string): BigNumber {
    return ethers.utils.parseUnits(amount, 6);
  }

  /**
   * Check if address has sufficient USDC
   */
  async hasSufficientUSDC(
    address: string,
    requiredAmount: string,
    network?: TestnetNetwork
  ): Promise<boolean> {
    const balance = await this.getUSDCBalance(address, network);
    const required = this.formatUSDCAmount(requiredAmount);
    return balance.gte(required);
  }

  /**
   * Get USDC address for current network
   */
  getUSDCAddress(network: TestnetNetwork): string {
    const address = USDC_ADDRESSES[network];
    if (!address) {
      throw new Error(`USDC not available on ${network}`);
    }
    return address;
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Log message based on log level
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level >= this.options.logLevel) {
      const prefix = `[TokenManager]`;
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
