/**
 * Network configurations for supported testnets
 *
 * This file contains RPC endpoints, chain IDs, and other network-specific
 * configuration for all supported testnet networks.
 */

import { NetworkConfig, TestnetNetwork } from '../types';

/**
 * Network configurations mapped by network name
 */
export const NETWORK_CONFIGS: Record<TestnetNetwork, NetworkConfig> = {
  [TestnetNetwork.SEPOLIA]: {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://sepolia.etherscan.io',
    testnet: true,
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },

  [TestnetNetwork.GOERLI]: {
    name: 'Goerli',
    chainId: 5,
    rpcUrl: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://goerli.etherscan.io',
    testnet: true,
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },

  [TestnetNetwork.MUMBAI]: {
    name: 'Mumbai',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    symbol: 'MATIC',
    decimals: 18,
    explorer: 'https://mumbai.polygonscan.com',
    testnet: true,
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },

  [TestnetNetwork.ARBITRUM_SEPOLIA]: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://sepolia.arbiscan.io',
    testnet: true,
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },

  [TestnetNetwork.OPTIMISM_SEPOLIA]: {
    name: 'Optimism Sepolia',
    chainId: 11155420,
    rpcUrl: 'https://sepolia.optimism.io',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://sepolia-optimism.etherscan.io',
    testnet: true,
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },

  [TestnetNetwork.BASE_SEPOLIA]: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://sepolia.basescan.org',
    testnet: true,
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },
};

/**
 * Alternative RPC URLs for fallback
 */
export const ALTERNATIVE_RPC_URLS: Record<TestnetNetwork, string[]> = {
  [TestnetNetwork.SEPOLIA]: [
    'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    'https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    'https://rpc.sepolia.org',
    'https://eth-sepolia-public.unifra.io',
  ],

  [TestnetNetwork.GOERLI]: [
    'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
    'https://eth-goerli.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    'https://rpc.ankr.com/eth_goerli',
  ],

  [TestnetNetwork.MUMBAI]: [
    'https://rpc-mumbai.maticvigil.com',
    'https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    'https://rpc.ankr.com/polygon_mumbai',
    'https://matic-mumbai.chainstacklabs.com',
  ],

  [TestnetNetwork.ARBITRUM_SEPOLIA]: [
    'https://sepolia-rollup.arbitrum.io/rpc',
    'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
  ],

  [TestnetNetwork.OPTIMISM_SEPOLIA]: [
    'https://sepolia.optimism.io',
    'https://optimism-sepolia.blockpi.network/v1/rpc/public',
  ],

  [TestnetNetwork.BASE_SEPOLIA]: [
    'https://sepolia.base.org',
    'https://base-sepolia.blockpi.network/v1/rpc/public',
  ],
};

/**
 * Get network configuration by network name
 */
export function getNetworkConfig(network: TestnetNetwork): NetworkConfig {
  const config = NETWORK_CONFIGS[network];
  if (!config) {
    throw new Error(`Network configuration not found for: ${network}`);
  }
  return config;
}

/**
 * Get alternative RPC URLs for a network
 */
export function getAlternativeRpcUrls(network: TestnetNetwork): string[] {
  return ALTERNATIVE_RPC_URLS[network] || [];
}

/**
 * Get network by chain ID
 */
export function getNetworkByChainId(chainId: number): TestnetNetwork | null {
  const entry = Object.entries(NETWORK_CONFIGS).find(
    ([, config]) => config.chainId === chainId
  );
  return entry ? (entry[0] as TestnetNetwork) : null;
}

/**
 * Check if a network is supported
 */
export function isNetworkSupported(network: string): network is TestnetNetwork {
  return Object.values(TestnetNetwork).includes(network as TestnetNetwork);
}

/**
 * Get all supported networks
 */
export function getAllNetworks(): TestnetNetwork[] {
  return Object.values(TestnetNetwork);
}

/**
 * Network metadata for UI display
 */
export const NETWORK_METADATA = {
  [TestnetNetwork.SEPOLIA]: {
    color: '#3099f2',
    icon: '🔷',
    description: 'Ethereum Sepolia testnet - Recommended for Ethereum testing',
  },
  [TestnetNetwork.GOERLI]: {
    color: '#f6851b',
    icon: '🔶',
    description: 'Ethereum Goerli testnet - Deprecated, use Sepolia instead',
  },
  [TestnetNetwork.MUMBAI]: {
    color: '#8247e5',
    icon: '💜',
    description: 'Polygon Mumbai testnet - For Polygon/MATIC testing',
  },
  [TestnetNetwork.ARBITRUM_SEPOLIA]: {
    color: '#28a0f0',
    icon: '🔵',
    description: 'Arbitrum Sepolia testnet - L2 scaling solution',
  },
  [TestnetNetwork.OPTIMISM_SEPOLIA]: {
    color: '#ff0420',
    icon: '🔴',
    description: 'Optimism Sepolia testnet - Optimistic rollup L2',
  },
  [TestnetNetwork.BASE_SEPOLIA]: {
    color: '#0052ff',
    icon: '🟦',
    description: 'Base Sepolia testnet - Coinbase L2 network',
  },
} as const;
