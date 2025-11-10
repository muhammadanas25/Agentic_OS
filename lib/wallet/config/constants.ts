/**
 * Constants used throughout the wallet system
 */

import { RetryConfig } from '../types';

// ============================================================================
// Wallet Constants
// ============================================================================

/**
 * BIP44 derivation paths
 */
export const DERIVATION_PATHS = {
  ETHEREUM: "m/44'/60'/0'/0/0",
  ETHEREUM_LEDGER: "m/44'/60'/0'/0",
  ETHEREUM_LEDGER_LIVE: "m/44'/60'/0'/0/0",
} as const;

/**
 * Mnemonic configuration
 */
export const MNEMONIC = {
  WORD_COUNT_12: 12,
  WORD_COUNT_24: 24,
  DEFAULT_WORD_COUNT: 12,
  ENTROPY_BITS_128: 128, // For 12 words
  ENTROPY_BITS_256: 256, // For 24 words
} as const;

/**
 * Password requirements
 */
export const PASSWORD = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: false,
} as const;

// ============================================================================
// Encryption Constants
// ============================================================================

/**
 * Encryption algorithm configuration
 */
export const ENCRYPTION = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12, // 96 bits for GCM
  TAG_LENGTH: 16, // 128 bits
  SALT_LENGTH: 16, // 128 bits
} as const;

/**
 * Key derivation configuration (PBKDF2)
 */
export const KEY_DERIVATION = {
  ITERATIONS: 100000,
  KEY_LENGTH: 32, // 256 bits
  DIGEST: 'SHA-256',
} as const;

// ============================================================================
// Network & RPC Constants
// ============================================================================

/**
 * RPC request configuration
 */
export const RPC = {
  TIMEOUT: 30000, // 30 seconds
  POLLING_INTERVAL: 15000, // 15 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  BATCH_SIZE: 10,
} as const;

/**
 * Transaction configuration
 */
export const TRANSACTION = {
  CONFIRMATION_BLOCKS: 2,
  MAX_CONFIRMATION_WAIT: 300000, // 5 minutes
  GAS_LIMIT_BUFFER: 1.2, // 20% buffer
  DEFAULT_GAS_LIMIT: 21000,
  ERC20_TRANSFER_GAS_LIMIT: 65000,
  MIN_GAS_PRICE_GWEI: 1,
  MAX_GAS_PRICE_GWEI: 1000,
} as const;

/**
 * Gas preferences
 */
export const GAS_MULTIPLIERS = {
  slow: 0.8,
  average: 1.0,
  fast: 1.2,
} as const;

// ============================================================================
// Storage Constants
// ============================================================================

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  WALLETS: 'browseros_wallets',
  NETWORKS: 'browseros_networks',
  TRANSACTIONS: 'browseros_transactions',
  PREFERENCES: 'browseros_preferences',
  FAUCET_HISTORY: 'browseros_faucet_history',
  CACHE: 'browseros_cache',
} as const;

/**
 * Storage version for migrations
 */
export const STORAGE_VERSION = '1.0.0';

/**
 * Cache TTL (Time To Live) in milliseconds
 */
export const CACHE_TTL = {
  BALANCE: 30000, // 30 seconds
  GAS_PRICE: 15000, // 15 seconds
  BLOCK_NUMBER: 15000, // 15 seconds
  TRANSACTION: 5000, // 5 seconds
  NETWORK_STATS: 60000, // 1 minute
} as const;

// ============================================================================
// Session Constants
// ============================================================================

/**
 * Session configuration
 */
export const SESSION = {
  TIMEOUT: 300000, // 5 minutes
  INACTIVITY_TIMEOUT: 600000, // 10 minutes
  MAX_SESSIONS: 5,
  EXTEND_ON_ACTIVITY: true,
} as const;

// ============================================================================
// Retry Configuration
// ============================================================================

/**
 * Network retry configuration
 */
export const NETWORK_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoff: 'exponential',
  initialDelay: 1000,
  maxDelay: 30000,
};

/**
 * Faucet retry configuration
 */
export const FAUCET_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  backoff: 'exponential',
  initialDelay: 2000,
  maxDelay: 60000,
};

/**
 * Transaction retry configuration
 */
export const TRANSACTION_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoff: 'linear',
  initialDelay: 5000,
  maxDelay: 30000,
};

// ============================================================================
// Faucet Constants
// ============================================================================

/**
 * Faucet configuration
 */
export const FAUCET = {
  DEFAULT_TIMEOUT: 300000, // 5 minutes
  MAX_RETRY_ATTEMPTS: 5,
  RATE_LIMIT_CHECK_INTERVAL: 60000, // 1 minute
  TRANSACTION_WAIT_TIMEOUT: 600000, // 10 minutes
  MIN_AMOUNT_WEI: '1000000000000000', // 0.001 ETH
} as const;

/**
 * Faucet rate limit storage key prefix
 */
export const FAUCET_RATE_LIMIT_PREFIX = 'faucet_rate_limit_';

// ============================================================================
// Validation Patterns
// ============================================================================

/**
 * Regular expressions for validation
 */
export const REGEX_PATTERNS = {
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  PRIVATE_KEY: /^(0x)?[a-fA-F0-9]{64}$/,
  TX_HASH: /^0x[a-fA-F0-9]{64}$/,
  MNEMONIC_12: /^(\w+\s){11}\w+$/,
  MNEMONIC_24: /^(\w+\s){23}\w+$/,
  HEX: /^0x[a-fA-F0-9]*$/,
  URL: /^https?:\/\/.+/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Standard error messages
 */
export const ERROR_MESSAGES = {
  // Wallet errors
  INVALID_PASSWORD: 'Invalid password. Password must be at least 12 characters.',
  WEAK_PASSWORD: 'Password is too weak. Use a mix of uppercase, lowercase, and numbers.',
  WALLET_NOT_FOUND: 'Wallet not found. Please import or create a wallet first.',
  WALLET_LOCKED: 'Wallet is locked. Please unlock it first.',
  WALLET_ALREADY_EXISTS: 'A wallet with this address already exists.',
  INVALID_MNEMONIC: 'Invalid mnemonic phrase. Please check and try again.',
  INVALID_PRIVATE_KEY: 'Invalid private key format.',

  // Network errors
  NETWORK_UNREACHABLE: 'Network is unreachable. Please check your connection.',
  RPC_ERROR: 'RPC request failed. Please try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNSUPPORTED_NETWORK: 'This network is not supported.',

  // Transaction errors
  INVALID_ADDRESS: 'Invalid Ethereum address.',
  INSUFFICIENT_FUNDS: 'Insufficient funds to complete this transaction.',
  GAS_ESTIMATION_FAILED: 'Failed to estimate gas. Please try again.',
  TRANSACTION_FAILED: 'Transaction failed. Please check the details and try again.',
  NONCE_TOO_LOW: 'Transaction nonce is too low. Please refresh and try again.',

  // Faucet errors
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  FAUCET_UNAVAILABLE: 'Faucet is currently unavailable. Please try a different one.',
  FAUCET_EMPTY: 'Faucet has no funds. Please try a different one.',
  FAUCET_REQUEST_FAILED: 'Failed to request tokens from faucet.',

  // Storage errors
  STORAGE_ERROR: 'Failed to access storage. Please check permissions.',
  ENCRYPTION_ERROR: 'Failed to encrypt data.',
  DECRYPTION_ERROR: 'Failed to decrypt data. Invalid password?',

  // General errors
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

/**
 * Standard success messages
 */
export const SUCCESS_MESSAGES = {
  WALLET_CREATED: 'Wallet created successfully!',
  WALLET_IMPORTED: 'Wallet imported successfully!',
  TRANSACTION_SENT: 'Transaction sent successfully!',
  TRANSACTION_CONFIRMED: 'Transaction confirmed!',
  FAUCET_REQUEST_SENT: 'Faucet request sent!',
  TOKENS_RECEIVED: 'Tokens received successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// ============================================================================
// UI Constants
// ============================================================================

/**
 * UI configuration
 */
export const UI = {
  TRANSACTION_HISTORY_PAGE_SIZE: 20,
  BALANCE_REFRESH_INTERVAL: 30000, // 30 seconds
  NOTIFICATION_DURATION: 5000, // 5 seconds
  ANIMATION_DURATION: 300, // 300ms
  DEBOUNCE_DELAY: 300, // 300ms
} as const;

/**
 * Transaction types for display
 */
export const TRANSACTION_TYPES = {
  SEND: 'send',
  RECEIVE: 'receive',
  CONTRACT: 'contract',
  FAUCET: 'faucet',
} as const;

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Feature flags for enabling/disabling features
 */
export const FEATURES = {
  ENABLE_MAINNET: false, // NEVER enable for testnet-only version
  ENABLE_CUSTOM_NETWORKS: true,
  ENABLE_HARDWARE_WALLETS: false,
  ENABLE_ERC20_TOKENS: false,
  ENABLE_NFT_SUPPORT: false,
  ENABLE_TRANSACTION_HISTORY: true,
  ENABLE_FAUCET_AUTOMATION: true,
  ENABLE_GAS_OPTIMIZATION: true,
  ENABLE_MULTI_WALLET: true,
  ENABLE_ANALYTICS: false,
} as const;

// ============================================================================
// Versioning
// ============================================================================

/**
 * Wallet library version
 */
export const VERSION = '1.0.0';

/**
 * Minimum required versions
 */
export const MIN_VERSIONS = {
  NODEJS: '18.0.0',
  CHROME: '90.0.0',
} as const;

// ============================================================================
// External Links
// ============================================================================

/**
 * External documentation and resources
 */
export const EXTERNAL_LINKS = {
  DOCS: 'https://docs.browseros.com/wallet',
  SUPPORT: 'https://support.browseros.com',
  GITHUB: 'https://github.com/anthropics/Agentic_OS',
  DISCORD: 'https://discord.gg/browseros',
  ETHERSCAN_API_DOCS: 'https://docs.etherscan.io',
  WEB3_SECURITY: 'https://ethereum.org/en/developers/docs/security/',
} as const;

// ============================================================================
// Development Constants
// ============================================================================

/**
 * Development mode configuration
 */
export const DEV = {
  ENABLE_DEBUG_LOGGING: process.env.NODE_ENV === 'development',
  MOCK_RPC_CALLS: false,
  SKIP_ENCRYPTION: false, // NEVER set to true in production
  FAST_MODE: false, // Reduces timeouts for faster testing
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type GasPreference = keyof typeof GAS_MULTIPLIERS;
export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];
