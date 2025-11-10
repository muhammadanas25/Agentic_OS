/**
 * Wallet Storage
 *
 * Handles persistent storage of encrypted wallet data and transaction history
 * using browser extension storage API.
 */

import {
  WalletStorageSchema,
  EncryptedWallet,
  Transaction,
  TransactionHistoryItem,
  WalletPreferences,
  TestnetNetwork,
  FaucetHistoryItem,
} from './types';
import { STORAGE_VERSION, STORAGE_KEYS } from './config';

interface StorageOptions {
  storageKey?: string;
}

/**
 * Storage manager for wallet data
 */
export class WalletStorage {
  private storageKey: string;
  private cache: WalletStorageSchema | null = null;

  constructor(options: StorageOptions = {}) {
    this.storageKey = options.storageKey || STORAGE_KEYS.WALLETS;
  }

  // ========================================================================
  // Wallet Operations
  // ========================================================================

  async saveWallet(wallet: EncryptedWallet): Promise<void> {
    const data = await this.getData();
    data.wallets[wallet.address] = wallet;
    await this.setData(data);
  }

  async getWallet(address: string): Promise<EncryptedWallet | null> {
    const data = await this.getData();
    return data.wallets[address] || null;
  }

  async getWallets(): Promise<Record<string, EncryptedWallet>> {
    const data = await this.getData();
    return data.wallets;
  }

  async deleteWallet(address: string): Promise<void> {
    const data = await this.getData();
    delete data.wallets[address];
    await this.setData(data);
  }

  async updateWalletLastUsed(address: string): Promise<void> {
    const data = await this.getData();
    if (data.wallets[address]) {
      data.wallets[address].lastUsed = Date.now();
      await this.setData(data);
    }
  }

  // ========================================================================
  // Transaction Operations
  // ========================================================================

  async saveTransaction(tx: Transaction): Promise<void> {
    const data = await this.getData();
    data.transactions[tx.hash] = tx;
    await this.setData(data);
  }

  async getTransaction(txHash: string): Promise<Transaction | null> {
    const data = await this.getData();
    return data.transactions[txHash] || null;
  }

  async getTransactionHistory(address: string): Promise<TransactionHistoryItem[]> {
    const data = await this.getData();
    const transactions = Object.values(data.transactions)
      .filter((tx) => tx.from === address || tx.to === address)
      .sort((a, b) => b.timestamp - a.timestamp);

    return transactions.map((tx) => ({
      ...tx,
      type: this.getTransactionType(tx, address),
    }));
  }

  // ========================================================================
  // Faucet History Operations
  // ========================================================================

  async saveFaucetHistory(
    address: string,
    item: FaucetHistoryItem
  ): Promise<void> {
    const data = await this.getData();
    if (!data.faucetHistory[address]) {
      data.faucetHistory[address] = [];
    }
    data.faucetHistory[address].push(item);
    await this.setData(data);
  }

  async getFaucetHistory(address: string): Promise<FaucetHistoryItem[]> {
    const data = await this.getData();
    return data.faucetHistory[address] || [];
  }

  // ========================================================================
  // Preferences Operations
  // ========================================================================

  async getPreferences(): Promise<WalletPreferences> {
    const data = await this.getData();
    return data.preferences;
  }

  async setPreferences(prefs: Partial<WalletPreferences>): Promise<void> {
    const data = await this.getData();
    data.preferences = { ...data.preferences, ...prefs };
    await this.setData(data);
  }

  // ========================================================================
  // Storage Management
  // ========================================================================

  async clear(): Promise<void> {
    await this.setData(this.getDefaultData());
    this.cache = null;
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  private async getData(): Promise<WalletStorageSchema> {
    if (this.cache) {
      return this.cache;
    }

    try {
      // Try to use Chrome extension storage if available
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(this.storageKey);
        const data = result[this.storageKey];
        this.cache = data || this.getDefaultData();
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(this.storageKey);
        this.cache = stored ? JSON.parse(stored) : this.getDefaultData();
      }
    } catch (error) {
      console.error('[WalletStorage] Failed to get data:', error);
      this.cache = this.getDefaultData();
    }

    return this.cache;
  }

  private async setData(data: WalletStorageSchema): Promise<void> {
    this.cache = data;

    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [this.storageKey]: data });
      } else {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('[WalletStorage] Failed to set data:', error);
      throw error;
    }
  }

  private getDefaultData(): WalletStorageSchema {
    return {
      version: STORAGE_VERSION,
      wallets: {},
      networks: {},
      transactions: {},
      faucetHistory: {},
      preferences: {
        defaultNetwork: TestnetNetwork.SEPOLIA,
        autoRequestFaucet: false,
        showNotifications: true,
        gasPreference: 'average',
        confirmationBlocks: 2,
      },
    };
  }

  private getTransactionType(
    tx: Transaction,
    address: string
  ): 'send' | 'receive' | 'contract' | 'faucet' {
    if (tx.from.toLowerCase() === address.toLowerCase()) {
      return tx.data !== '0x' ? 'contract' : 'send';
    } else {
      // Check if it's from a known faucet
      // For now, just return 'receive'
      return 'receive';
    }
  }
}
