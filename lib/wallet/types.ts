/**
 * Type definitions for BrowserOS Wallet System
 *
 * This file contains all TypeScript interfaces, types, and enums used throughout
 * the wallet implementation.
 */

import { BigNumber } from 'ethers';

// ============================================================================
// Enums
// ============================================================================

/**
 * Supported testnet networks
 */
export enum TestnetNetwork {
  SEPOLIA = 'sepolia',
  GOERLI = 'goerli', // Deprecated but still supported
  MUMBAI = 'mumbai',
  ARBITRUM_SEPOLIA = 'arb-sepolia',
  OPTIMISM_SEPOLIA = 'op-sepolia',
  BASE_SEPOLIA = 'base-sepolia',
}

/**
 * Transaction status states
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Faucet integration types
 */
export enum FaucetType {
  API = 'api',
  WEB = 'web',
  SOCIAL = 'social',
  CAPTCHA = 'captcha',
}

/**
 * Log levels for debugging
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Wallet error codes
 */
export enum WalletErrorCode {
  // Network Errors
  NETWORK_UNREACHABLE = 'E001',
  RPC_ERROR = 'E002',
  TIMEOUT = 'E003',

  // Wallet Errors
  INVALID_PASSWORD = 'E101',
  WALLET_LOCKED = 'E102',
  INSUFFICIENT_FUNDS = 'E103',
  WALLET_NOT_FOUND = 'E104',
  WALLET_ALREADY_EXISTS = 'E105',
  INVALID_MNEMONIC = 'E106',
  INVALID_PRIVATE_KEY = 'E107',

  // Transaction Errors
  INVALID_ADDRESS = 'E201',
  GAS_ESTIMATION_FAILED = 'E202',
  TRANSACTION_FAILED = 'E203',
  NONCE_TOO_LOW = 'E204',
  REPLACEMENT_UNDERPRICED = 'E205',

  // Faucet Errors
  RATE_LIMIT_EXCEEDED = 'E301',
  FAUCET_UNAVAILABLE = 'E302',
  FAUCET_EMPTY = 'E303',
  FAUCET_REQUEST_FAILED = 'E304',

  // Storage Errors
  STORAGE_ERROR = 'E401',
  ENCRYPTION_ERROR = 'E402',
  DECRYPTION_ERROR = 'E403',

  // General Errors
  UNKNOWN_ERROR = 'E999',
}

// ============================================================================
// Wallet Interfaces
// ============================================================================

/**
 * Wallet object returned after creation or import
 */
export interface Wallet {
  address: string;
  publicKey: string;
  mnemonic?: string; // Only present during creation
  privateKey?: string; // Only present during creation/import, never stored
  derivationPath?: string;
  createdAt: number;
  lastUsed: number;
}

/**
 * Encrypted wallet data stored in extension storage
 */
export interface EncryptedWallet {
  address: string;
  publicKey: string;
  encrypted: string; // Encrypted private key
  salt: string; // Salt used for encryption
  derivationPath?: string;
  createdAt: number;
  lastUsed: number;
}

/**
 * Wallet creation options
 */
export interface WalletCreationOptions {
  derivationPath?: string; // BIP44 derivation path
  wordCount?: 12 | 24; // Mnemonic word count
}

/**
 * Wallet import options
 */
export interface WalletImportOptions {
  derivationPath?: string;
  validateChecksum?: boolean;
}

// ============================================================================
// Network Interfaces
// ============================================================================

/**
 * Network configuration
 */
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  decimals: number;
  explorer: string;
  testnet: boolean;
  multicallAddress?: string;
  ensRegistry?: string;
}

/**
 * Gas price information
 */
export interface GasPrice {
  slow: BigNumber;
  average: BigNumber;
  fast: BigNumber;
  baseFee?: BigNumber;
  maxPriorityFeePerGas?: BigNumber;
}

/**
 * Network statistics
 */
export interface NetworkStats {
  blockNumber: number;
  gasPrice: GasPrice;
  chainId: number;
  networkName: string;
  lastUpdated: number;
}

// ============================================================================
// Transaction Interfaces
// ============================================================================

/**
 * Transaction parameters for sending
 */
export interface TransactionParams {
  from: string;
  to: string;
  value: string; // In ETH/native token
  network: TestnetNetwork;
  gasLimit?: number;
  maxFeePerGas?: string; // In gwei
  maxPriorityFeePerGas?: string; // In gwei
  data?: string; // For contract interactions
  nonce?: number;
}

/**
 * Transaction object
 */
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasLimit: number;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce: number;
  data: string;
  chainId: number;
  status: TransactionStatus;
  blockNumber?: number;
  blockHash?: string;
  timestamp: number;
  confirmations?: number;
  network: TestnetNetwork;
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  status: 0 | 1; // 0 = failed, 1 = success
  logs: TransactionLog[];
  contractAddress?: string;
}

/**
 * Transaction log entry
 */
export interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

/**
 * Transaction history item
 */
export interface TransactionHistoryItem extends Transaction {
  description?: string;
  type: 'send' | 'receive' | 'contract' | 'faucet';
}

// ============================================================================
// Faucet Interfaces
// ============================================================================

/**
 * Faucet configuration
 */
export interface FaucetConfig {
  name: string;
  network: TestnetNetwork;
  type: FaucetType;
  url: string;
  apiKey?: string;
  amount: string; // Expected amount in ETH
  rateLimit: {
    requests: number;
    period: number; // in seconds
  };
  requiresAuth?: boolean;
  active: boolean;
}

/**
 * Faucet request options
 */
export interface FaucetRequestOptions {
  preferredFaucet?: string;
  maxRetries?: number;
  waitForConfirmation?: boolean;
  timeout?: number; // in milliseconds
}

/**
 * Faucet request result
 */
export interface FaucetResult {
  success: boolean;
  txHash?: string;
  amount?: string;
  faucetName?: string;
  estimatedTime?: number;
  error?: string;
  errorCode?: WalletErrorCode;
}

/**
 * Faucet rate limit info
 */
export interface FaucetRateLimit {
  canRequest: boolean;
  waitTime?: number; // seconds until next request
  lastRequest?: number; // timestamp
  requestsRemaining?: number;
}

/**
 * Faucet plugin interface for extensibility
 */
export interface IFaucetPlugin {
  name: string;
  network: TestnetNetwork;
  type: FaucetType;
  request(address: string): Promise<FaucetResult>;
  checkRateLimit(address: string): Promise<FaucetRateLimit>;
  isAvailable(): Promise<boolean>;
}

// ============================================================================
// Storage Interfaces
// ============================================================================

/**
 * Wallet storage schema
 */
export interface WalletStorageSchema {
  version: string;
  wallets: {
    [address: string]: EncryptedWallet;
  };
  networks: {
    [network: string]: NetworkConfig;
  };
  transactions: {
    [txHash: string]: Transaction;
  };
  preferences: WalletPreferences;
  faucetHistory: {
    [address: string]: FaucetHistoryItem[];
  };
}

/**
 * User preferences
 */
export interface WalletPreferences {
  defaultNetwork: TestnetNetwork;
  autoRequestFaucet: boolean;
  showNotifications: boolean;
  gasPreference: 'slow' | 'average' | 'fast';
  confirmationBlocks: number;
  customRpcUrls?: {
    [network: string]: string;
  };
}

/**
 * Faucet history item
 */
export interface FaucetHistoryItem {
  network: TestnetNetwork;
  faucetName: string;
  txHash: string;
  amount: string;
  timestamp: number;
  status: TransactionStatus;
}

// ============================================================================
// Balance Interfaces
// ============================================================================

/**
 * Balance information
 */
export interface Balance {
  value: BigNumber;
  formatted: string;
  symbol: string;
  network: TestnetNetwork;
  lastUpdated: number;
}

/**
 * Multi-network balance
 */
export interface MultiNetworkBalance {
  [network: string]: Balance;
}

/**
 * Token balance (for future ERC-20 support)
 */
export interface TokenBalance {
  token: Token;
  balance: BigNumber;
  formattedBalance: string;
}

/**
 * Token information (for future ERC-20 support)
 */
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  network: TestnetNetwork;
  logoUri?: string;
}

// ============================================================================
// Manager Interfaces
// ============================================================================

/**
 * Wallet manager options
 */
export interface WalletManagerOptions {
  debug?: boolean;
  logLevel?: LogLevel;
  storageKey?: string;
  sessionTimeout?: number; // in milliseconds
}

/**
 * Provider options
 */
export interface ProviderOptions {
  timeout?: number;
  pollingInterval?: number;
  maxRetries?: number;
  customHeaders?: Record<string, string>;
}

/**
 * Testnet provider interface
 */
export interface ITestnetProvider {
  connect(network: TestnetNetwork, options?: ProviderOptions): Promise<void>;
  disconnect(): Promise<void>;
  getBlockNumber(): Promise<number>;
  getGasPrice(): Promise<GasPrice>;
  getBalance(address: string): Promise<BigNumber>;
  getTransactionCount(address: string): Promise<number>;
  estimateGas(tx: Partial<TransactionParams>): Promise<BigNumber>;
  sendRawTransaction(signedTx: string): Promise<string>;
  getTransaction(txHash: string): Promise<Transaction | null>;
  waitForTransaction(txHash: string, confirmations?: number): Promise<TransactionReceipt>;
  getCurrentNetwork(): TestnetNetwork | null;
  getNetworkStats(): Promise<NetworkStats>;
}

// ============================================================================
// Error Interfaces
// ============================================================================

/**
 * Wallet error
 */
export interface WalletError {
  code: WalletErrorCode;
  message: string;
  details?: any;
  timestamp: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  backoff: 'linear' | 'exponential';
  initialDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Async function that can be retried
 */
export type RetryableFunction<T> = () => Promise<T>;

/**
 * Event handler type
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * Event emitter interface
 */
export interface IEventEmitter {
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  emit(event: string, data?: any): void;
}

// ============================================================================
// Encryption Interfaces
// ============================================================================

/**
 * Encryption result
 */
export interface EncryptionResult {
  encrypted: string;
  salt: string;
  iv: string;
}

/**
 * Key derivation options
 */
export interface KeyDerivationOptions {
  iterations?: number;
  keyLength?: number;
  digest?: string;
}

// ============================================================================
// Metrics & Monitoring
// ============================================================================

/**
 * Wallet metrics for monitoring
 */
export interface WalletMetrics {
  // Usage metrics
  walletsCreated: number;
  transactionsSubmitted: number;
  faucetRequestsSuccessful: number;
  faucetRequestsFailed: number;

  // Performance metrics
  avgTransactionTime: number;
  avgFaucetResponseTime: number;
  rpcLatency: number;

  // Error metrics
  errorsByType: Record<WalletErrorCode, number>;
  networkFailures: number;
}

// ============================================================================
// Constants & Defaults
// ============================================================================

/**
 * Default values used throughout the wallet system
 */
export const DEFAULTS = {
  DERIVATION_PATH: "m/44'/60'/0'/0/0", // BIP44 Ethereum derivation path
  MNEMONIC_WORD_COUNT: 12,
  CONFIRMATION_BLOCKS: 2,
  SESSION_TIMEOUT: 300000, // 5 minutes
  POLLING_INTERVAL: 15000, // 15 seconds
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000, // 1 second
  MAX_RETRY_DELAY: 30000, // 30 seconds
  GAS_LIMIT_BUFFER: 1.2, // 20% buffer for gas estimation
  MIN_PASSWORD_LENGTH: 12,
  PBKDF2_ITERATIONS: 100000,
  STORAGE_VERSION: '1.0.0',
} as const;

/**
 * Regular expressions for validation
 */
export const REGEX = {
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  PRIVATE_KEY: /^(0x)?[a-fA-F0-9]{64}$/,
  TX_HASH: /^0x[a-fA-F0-9]{64}$/,
  MNEMONIC_12: /^(\w+\s){11}\w+$/,
  MNEMONIC_24: /^(\w+\s){23}\w+$/,
} as const;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for checking if value is a valid Ethereum address
 */
export function isValidAddress(address: unknown): address is string {
  return typeof address === 'string' && REGEX.ETH_ADDRESS.test(address);
}

/**
 * Type guard for checking if value is a valid transaction hash
 */
export function isValidTxHash(hash: unknown): hash is string {
  return typeof hash === 'string' && REGEX.TX_HASH.test(hash);
}

/**
 * Type guard for checking if value is a valid private key
 */
export function isValidPrivateKey(key: unknown): key is string {
  return typeof key === 'string' && REGEX.PRIVATE_KEY.test(key);
}

/**
 * Type guard for checking if network is supported
 */
export function isSupportedNetwork(network: unknown): network is TestnetNetwork {
  return typeof network === 'string' && Object.values(TestnetNetwork).includes(network as TestnetNetwork);
}

// ============================================================================
// Exports
// ============================================================================

export type {
  IFaucetPlugin,
  ITestnetProvider,
  IEventEmitter,
};
