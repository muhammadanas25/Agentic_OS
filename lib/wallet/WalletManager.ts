/**
 * Wallet Manager
 *
 * Core wallet management functionality including creation, import,
 * transaction signing, and balance tracking.
 */

import { ethers, BigNumber } from 'ethers';
import {
  Wallet,
  EncryptedWallet,
  WalletCreationOptions,
  WalletImportOptions,
  WalletManagerOptions,
  TransactionParams,
  TestnetNetwork,
  WalletErrorCode,
  WalletError,
  Balance,
  MultiNetworkBalance,
  Transaction,
  TransactionReceipt,
  TransactionHistoryItem,
  LogLevel,
} from './types';
import { TestnetProvider } from './TestnetProvider';
import { WalletStorage } from './WalletStorage';
import { KeyManager } from './KeyManager';
import { TransactionManager } from './TransactionManager';
import {
  DERIVATION_PATHS,
  MNEMONIC,
  PASSWORD,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from './config';
import { isValidAddress, isValidPrivateKey, isSupportedNetwork } from './types';

/**
 * Main wallet manager class
 */
export class WalletManager {
  private provider: TestnetProvider;
  private storage: WalletStorage;
  private keyManager: KeyManager;
  private txManager: TransactionManager;
  private options: Required<WalletManagerOptions>;
  private currentWallet: Wallet | null = null;
  private unlockedWallets: Map<string, ethers.Wallet> = new Map();

  constructor(options: WalletManagerOptions = {}) {
    this.options = {
      debug: options.debug || false,
      logLevel: options.logLevel || LogLevel.INFO,
      storageKey: options.storageKey || 'browseros_wallet',
      sessionTimeout: options.sessionTimeout || 300000, // 5 minutes
    };

    this.provider = new TestnetProvider({
      debug: this.options.debug,
    });

    this.storage = new WalletStorage({
      storageKey: this.options.storageKey,
    });

    this.keyManager = new KeyManager();
    this.txManager = new TransactionManager(this.provider);

    this.log(LogLevel.INFO, 'WalletManager initialized');
  }

  // ========================================================================
  // Wallet Creation & Import
  // ========================================================================

  /**
   * Create a new wallet with a random mnemonic
   */
  async createWallet(
    password: string,
    options: WalletCreationOptions = {}
  ): Promise<Wallet> {
    this.log(LogLevel.INFO, 'Creating new wallet');

    // Validate password
    this.validatePassword(password);

    // Generate mnemonic
    const wordCount = options.wordCount || MNEMONIC.DEFAULT_WORD_COUNT;
    const entropyBits = wordCount === 12 ? 128 : 256;
    const entropy = ethers.utils.randomBytes(entropyBits / 8);
    const mnemonic = ethers.utils.entropyToMnemonic(entropy);

    // Derive wallet from mnemonic
    const derivationPath =
      options.derivationPath || DERIVATION_PATHS.ETHEREUM;
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    const derivedNode = hdNode.derivePath(derivationPath);
    const ethersWallet = new ethers.Wallet(derivedNode.privateKey);

    // Create wallet object
    const wallet: Wallet = {
      address: ethersWallet.address,
      publicKey: ethersWallet.publicKey,
      mnemonic,
      privateKey: ethersWallet.privateKey,
      derivationPath,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    // Encrypt and store wallet
    await this.storeWallet(wallet, password);

    // Set as current wallet
    this.currentWallet = wallet;
    this.unlockedWallets.set(wallet.address, ethersWallet);

    this.log(LogLevel.INFO, `Wallet created: ${wallet.address}`);

    // Return wallet (will include mnemonic and private key)
    return wallet;
  }

  /**
   * Import wallet from mnemonic phrase
   */
  async importWallet(
    mnemonic: string,
    password: string,
    options: WalletImportOptions = {}
  ): Promise<Wallet> {
    this.log(LogLevel.INFO, 'Importing wallet from mnemonic');

    // Validate inputs
    this.validatePassword(password);
    this.validateMnemonic(mnemonic);

    const derivationPath =
      options.derivationPath || DERIVATION_PATHS.ETHEREUM;

    // Derive wallet
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic.trim());
    const derivedNode = hdNode.derivePath(derivationPath);
    const ethersWallet = new ethers.Wallet(derivedNode.privateKey);

    // Create wallet object
    const wallet: Wallet = {
      address: ethersWallet.address,
      publicKey: ethersWallet.publicKey,
      mnemonic,
      privateKey: ethersWallet.privateKey,
      derivationPath,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    // Check if wallet already exists
    const existingWallets = await this.storage.getWallets();
    if (existingWallets[wallet.address]) {
      throw this.createError(
        WalletErrorCode.WALLET_ALREADY_EXISTS,
        ERROR_MESSAGES.WALLET_ALREADY_EXISTS
      );
    }

    // Encrypt and store
    await this.storeWallet(wallet, password);

    // Set as current wallet
    this.currentWallet = wallet;
    this.unlockedWallets.set(wallet.address, ethersWallet);

    this.log(LogLevel.INFO, `Wallet imported: ${wallet.address}`);

    return wallet;
  }

  /**
   * Import wallet from private key
   */
  async importFromPrivateKey(
    privateKey: string,
    password: string
  ): Promise<Wallet> {
    this.log(LogLevel.INFO, 'Importing wallet from private key');

    // Validate inputs
    this.validatePassword(password);

    if (!isValidPrivateKey(privateKey)) {
      throw this.createError(
        WalletErrorCode.INVALID_PRIVATE_KEY,
        ERROR_MESSAGES.INVALID_PRIVATE_KEY
      );
    }

    // Normalize private key (add 0x if missing)
    const normalizedKey = privateKey.startsWith('0x')
      ? privateKey
      : `0x${privateKey}`;

    // Create wallet from private key
    const ethersWallet = new ethers.Wallet(normalizedKey);

    const wallet: Wallet = {
      address: ethersWallet.address,
      publicKey: ethersWallet.publicKey,
      privateKey: ethersWallet.privateKey,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    // Check if wallet already exists
    const existingWallets = await this.storage.getWallets();
    if (existingWallets[wallet.address]) {
      throw this.createError(
        WalletErrorCode.WALLET_ALREADY_EXISTS,
        ERROR_MESSAGES.WALLET_ALREADY_EXISTS
      );
    }

    // Encrypt and store
    await this.storeWallet(wallet, password);

    // Set as current wallet
    this.currentWallet = wallet;
    this.unlockedWallets.set(wallet.address, ethersWallet);

    this.log(LogLevel.INFO, `Wallet imported from private key: ${wallet.address}`);

    return wallet;
  }

  // ========================================================================
  // Wallet Management
  // ========================================================================

  /**
   * Get all wallet addresses
   */
  async getWalletAddresses(): Promise<string[]> {
    const wallets = await this.storage.getWallets();
    return Object.keys(wallets);
  }

  /**
   * Get wallet info (without private data)
   */
  async getWalletInfo(address: string): Promise<Omit<Wallet, 'privateKey' | 'mnemonic'>> {
    const encryptedWallet = await this.storage.getWallet(address);
    if (!encryptedWallet) {
      throw this.createError(
        WalletErrorCode.WALLET_NOT_FOUND,
        ERROR_MESSAGES.WALLET_NOT_FOUND
      );
    }

    return {
      address: encryptedWallet.address,
      publicKey: encryptedWallet.publicKey,
      derivationPath: encryptedWallet.derivationPath,
      createdAt: encryptedWallet.createdAt,
      lastUsed: encryptedWallet.lastUsed,
    };
  }

  /**
   * Unlock wallet with password
   */
  async unlockWallet(address: string, password: string): Promise<void> {
    this.log(LogLevel.INFO, `Unlocking wallet: ${address}`);

    const encryptedWallet = await this.storage.getWallet(address);
    if (!encryptedWallet) {
      throw this.createError(
        WalletErrorCode.WALLET_NOT_FOUND,
        ERROR_MESSAGES.WALLET_NOT_FOUND
      );
    }

    try {
      // Decrypt private key
      const privateKey = await this.keyManager.decrypt(
        encryptedWallet.encrypted,
        password,
        encryptedWallet.salt
      );

      // Create ethers wallet
      const ethersWallet = new ethers.Wallet(privateKey);

      // Verify address matches
      if (ethersWallet.address !== address) {
        throw new Error('Address mismatch after decryption');
      }

      // Store unlocked wallet
      this.unlockedWallets.set(address, ethersWallet);

      // Update last used
      await this.storage.updateWalletLastUsed(address);

      this.log(LogLevel.INFO, `Wallet unlocked: ${address}`);
    } catch (error) {
      throw this.createError(
        WalletErrorCode.INVALID_PASSWORD,
        ERROR_MESSAGES.INVALID_PASSWORD,
        error
      );
    }
  }

  /**
   * Lock wallet (remove from memory)
   */
  lockWallet(address: string): void {
    this.unlockedWallets.delete(address);
    this.log(LogLevel.INFO, `Wallet locked: ${address}`);
  }

  /**
   * Lock all wallets
   */
  lockAllWallets(): void {
    this.unlockedWallets.clear();
    this.currentWallet = null;
    this.log(LogLevel.INFO, 'All wallets locked');
  }

  /**
   * Delete wallet (WARNING: irreversible)
   */
  async deleteWallet(address: string): Promise<void> {
    this.log(LogLevel.WARN, `Deleting wallet: ${address}`);

    await this.storage.deleteWallet(address);
    this.unlockedWallets.delete(address);

    if (this.currentWallet?.address === address) {
      this.currentWallet = null;
    }
  }

  // ========================================================================
  // Balance & Network Operations
  // ========================================================================

  /**
   * Get balance for address on current or specified network
   */
  async getBalance(
    address: string,
    network?: TestnetNetwork
  ): Promise<BigNumber> {
    if (!isValidAddress(address)) {
      throw this.createError(
        WalletErrorCode.INVALID_ADDRESS,
        ERROR_MESSAGES.INVALID_ADDRESS
      );
    }

    const targetNetwork = network || this.provider.getCurrentNetwork();
    if (!targetNetwork) {
      throw this.createError(
        WalletErrorCode.NETWORK_UNREACHABLE,
        'No network connected'
      );
    }

    if (network && network !== this.provider.getCurrentNetwork()) {
      await this.provider.connect(network);
    }

    const balance = await this.provider.getBalance(address);
    return balance;
  }

  /**
   * Get formatted balance with symbol
   */
  async getFormattedBalance(
    address: string,
    network?: TestnetNetwork
  ): Promise<Balance> {
    const balance = await this.getBalance(address, network);
    const currentNetwork = network || this.provider.getCurrentNetwork()!;
    const networkConfig = this.provider.getNetworkConfig(currentNetwork);

    return {
      value: balance,
      formatted: ethers.utils.formatEther(balance),
      symbol: networkConfig.symbol,
      network: currentNetwork,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get balances across all supported networks
   */
  async getAllBalances(address: string): Promise<MultiNetworkBalance> {
    const balances: MultiNetworkBalance = {};
    const networks = Object.values(TestnetNetwork);

    for (const network of networks) {
      try {
        const balance = await this.getFormattedBalance(address, network);
        balances[network] = balance;
      } catch (error) {
        this.log(LogLevel.WARN, `Failed to get balance for ${network}:`, error);
        // Continue with other networks
      }
    }

    return balances;
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(network: TestnetNetwork): Promise<void> {
    if (!isSupportedNetwork(network)) {
      throw this.createError(
        WalletErrorCode.NETWORK_UNREACHABLE,
        ERROR_MESSAGES.UNSUPPORTED_NETWORK
      );
    }

    await this.provider.connect(network);
    this.log(LogLevel.INFO, `Switched to network: ${network}`);
  }

  // ========================================================================
  // Transaction Operations
  // ========================================================================

  /**
   * Send transaction
   */
  async sendTransaction(params: TransactionParams): Promise<string> {
    this.log(LogLevel.INFO, `Sending transaction from ${params.from} to ${params.to}`);

    // Validate inputs
    if (!isValidAddress(params.from) || !isValidAddress(params.to)) {
      throw this.createError(
        WalletErrorCode.INVALID_ADDRESS,
        ERROR_MESSAGES.INVALID_ADDRESS
      );
    }

    // Get unlocked wallet
    const wallet = this.unlockedWallets.get(params.from);
    if (!wallet) {
      throw this.createError(
        WalletErrorCode.WALLET_LOCKED,
        ERROR_MESSAGES.WALLET_LOCKED
      );
    }

    // Switch network if needed
    if (params.network !== this.provider.getCurrentNetwork()) {
      await this.provider.connect(params.network);
    }

    // Send transaction using transaction manager
    const txHash = await this.txManager.sendTransaction(wallet, params);

    this.log(LogLevel.INFO, `Transaction sent: ${txHash}`);

    return txHash;
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 2
  ): Promise<TransactionReceipt> {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string): Promise<Transaction | null> {
    return await this.provider.getTransaction(txHash);
  }

  /**
   * Get transaction history for address
   */
  async getTransactionHistory(address: string): Promise<TransactionHistoryItem[]> {
    return await this.storage.getTransactionHistory(address);
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Get current network
   */
  getCurrentNetwork(): TestnetNetwork | null {
    return this.provider.getCurrentNetwork();
  }

  /**
   * Get signer for address (for use with contracts)
   */
  getSigner(address: string): ethers.Wallet {
    const wallet = this.unlockedWallets.get(address);
    if (!wallet) {
      throw this.createError(
        WalletErrorCode.WALLET_LOCKED,
        ERROR_MESSAGES.WALLET_LOCKED
      );
    }
    return wallet.connect(this.provider.getProvider());
  }

  /**
   * Get provider instance
   */
  getProvider(): TestnetProvider {
    return this.provider;
  }

  /**
   * Get storage instance
   */
  getStorage(): WalletStorage {
    return this.storage;
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Store wallet with encryption
   */
  private async storeWallet(wallet: Wallet, password: string): Promise<void> {
    if (!wallet.privateKey) {
      throw new Error('Private key is required for storage');
    }

    const { encrypted, salt } = await this.keyManager.encrypt(
      wallet.privateKey,
      password
    );

    const encryptedWallet: EncryptedWallet = {
      address: wallet.address,
      publicKey: wallet.publicKey,
      encrypted,
      salt,
      derivationPath: wallet.derivationPath,
      createdAt: wallet.createdAt,
      lastUsed: wallet.lastUsed,
    };

    await this.storage.saveWallet(encryptedWallet);
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < PASSWORD.MIN_LENGTH) {
      throw this.createError(
        WalletErrorCode.INVALID_PASSWORD,
        ERROR_MESSAGES.INVALID_PASSWORD
      );
    }

    // Check complexity
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);

    if (
      PASSWORD.REQUIRE_UPPERCASE && !hasUppercase ||
      PASSWORD.REQUIRE_LOWERCASE && !hasLowercase ||
      PASSWORD.REQUIRE_NUMBERS && !hasNumbers
    ) {
      throw this.createError(
        WalletErrorCode.INVALID_PASSWORD,
        ERROR_MESSAGES.WEAK_PASSWORD
      );
    }
  }

  /**
   * Validate mnemonic phrase
   */
  private validateMnemonic(mnemonic: string): void {
    try {
      const words = mnemonic.trim().split(/\s+/);
      if (words.length !== 12 && words.length !== 24) {
        throw new Error('Invalid word count');
      }

      // Try to create HD node (will throw if invalid)
      ethers.utils.HDNode.fromMnemonic(mnemonic.trim());
    } catch (error) {
      throw this.createError(
        WalletErrorCode.INVALID_MNEMONIC,
        ERROR_MESSAGES.INVALID_MNEMONIC,
        error
      );
    }
  }

  /**
   * Create error object
   */
  private createError(
    code: WalletErrorCode,
    message: string,
    details?: any
  ): WalletError {
    return {
      code,
      message,
      details,
      timestamp: Date.now(),
    };
  }

  /**
   * Log message based on log level
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level >= this.options.logLevel) {
      const prefix = `[WalletManager]`;
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
