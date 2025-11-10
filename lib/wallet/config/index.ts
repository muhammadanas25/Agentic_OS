/**
 * Configuration module exports
 *
 * Central export point for all wallet configuration
 */

// Network configurations
export {
  NETWORK_CONFIGS,
  ALTERNATIVE_RPC_URLS,
  NETWORK_METADATA,
  getNetworkConfig,
  getAlternativeRpcUrls,
  getNetworkByChainId,
  isNetworkSupported,
  getAllNetworks,
} from './networks';

// Faucet configurations
export {
  FAUCET_CONFIGS,
  FAUCET_INSTRUCTIONS,
  FAUCET_WAIT_TIMES,
  FAUCET_PRIORITY,
  FAUCET_GUIDES,
  getFaucetsForNetwork,
  getFaucetByName,
  getActiveFaucets,
  getRecommendedFaucet,
  requiresAuthentication,
  getExpectedAmount,
} from './faucets';

// Constants
export {
  DERIVATION_PATHS,
  MNEMONIC,
  PASSWORD,
  ENCRYPTION,
  KEY_DERIVATION,
  RPC,
  TRANSACTION,
  GAS_MULTIPLIERS,
  STORAGE_KEYS,
  STORAGE_VERSION,
  CACHE_TTL,
  SESSION,
  NETWORK_RETRY_CONFIG,
  FAUCET_RETRY_CONFIG,
  TRANSACTION_RETRY_CONFIG,
  FAUCET,
  FAUCET_RATE_LIMIT_PREFIX,
  REGEX_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  UI,
  TRANSACTION_TYPES,
  FEATURES,
  VERSION,
  MIN_VERSIONS,
  EXTERNAL_LINKS,
  DEV,
  type GasPreference,
  type TransactionType,
} from './constants';
