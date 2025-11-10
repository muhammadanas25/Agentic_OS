/**
 * Faucet configurations for testnet tokens
 *
 * This file contains configurations for various faucet services that provide
 * free testnet tokens for development and testing.
 */

import { FaucetConfig, FaucetType, TestnetNetwork } from '../types';

/**
 * Faucet configurations
 */
export const FAUCET_CONFIGS: FaucetConfig[] = [
  // ========================================
  // Sepolia Faucets
  // ========================================
  {
    name: 'Alchemy Sepolia Faucet',
    network: TestnetNetwork.SEPOLIA,
    type: FaucetType.WEB,
    url: 'https://sepoliafaucet.com',
    amount: '0.5',
    rateLimit: {
      requests: 1,
      period: 86400, // 24 hours
    },
    requiresAuth: true, // Requires Alchemy account
    active: true,
  },
  {
    name: 'Infura Sepolia Faucet',
    network: TestnetNetwork.SEPOLIA,
    type: FaucetType.WEB,
    url: 'https://www.infura.io/faucet/sepolia',
    amount: '0.5',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: true, // Requires Infura account
    active: true,
  },
  {
    name: 'QuickNode Sepolia Faucet',
    network: TestnetNetwork.SEPOLIA,
    type: FaucetType.WEB,
    url: 'https://faucet.quicknode.com/ethereum/sepolia',
    amount: '0.1',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: false,
    active: true,
  },
  {
    name: 'Sepolia PoW Faucet',
    network: TestnetNetwork.SEPOLIA,
    type: FaucetType.WEB,
    url: 'https://sepolia-faucet.pk910.de',
    amount: '0.5',
    rateLimit: {
      requests: 1,
      period: 3600, // 1 hour
    },
    requiresAuth: false,
    active: true,
  },

  // ========================================
  // Goerli Faucets (Deprecated)
  // ========================================
  {
    name: 'Alchemy Goerli Faucet',
    network: TestnetNetwork.GOERLI,
    type: FaucetType.WEB,
    url: 'https://goerlifaucet.com',
    amount: '0.25',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: true,
    active: false, // Goerli is deprecated
  },

  // ========================================
  // Mumbai (Polygon) Faucets
  // ========================================
  {
    name: 'Polygon Faucet',
    network: TestnetNetwork.MUMBAI,
    type: FaucetType.WEB,
    url: 'https://faucet.polygon.technology',
    amount: '0.5',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: false,
    active: true,
  },
  {
    name: 'Alchemy Mumbai Faucet',
    network: TestnetNetwork.MUMBAI,
    type: FaucetType.WEB,
    url: 'https://mumbaifaucet.com',
    amount: '0.5',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: true,
    active: true,
  },
  {
    name: 'QuickNode Mumbai Faucet',
    network: TestnetNetwork.MUMBAI,
    type: FaucetType.WEB,
    url: 'https://faucet.quicknode.com/polygon/mumbai',
    amount: '0.1',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: false,
    active: true,
  },

  // ========================================
  // Arbitrum Sepolia Faucets
  // ========================================
  {
    name: 'QuickNode Arbitrum Sepolia Faucet',
    network: TestnetNetwork.ARBITRUM_SEPOLIA,
    type: FaucetType.WEB,
    url: 'https://faucet.quicknode.com/arbitrum/sepolia',
    amount: '0.01',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: false,
    active: true,
  },
  {
    name: 'Alchemy Arbitrum Sepolia Faucet',
    network: TestnetNetwork.ARBITRUM_SEPOLIA,
    type: FaucetType.WEB,
    url: 'https://www.alchemy.com/faucets/arbitrum-sepolia',
    amount: '0.01',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: true,
    active: true,
  },

  // ========================================
  // Optimism Sepolia Faucets
  // ========================================
  {
    name: 'Optimism Sepolia Faucet',
    network: TestnetNetwork.OPTIMISM_SEPOLIA,
    type: FaucetType.WEB,
    url: 'https://app.optimism.io/faucet',
    amount: '1.0',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: false,
    active: true,
  },
  {
    name: 'QuickNode Optimism Sepolia Faucet',
    network: TestnetNetwork.OPTIMISM_SEPOLIA,
    type: FaucetType.WEB,
    url: 'https://faucet.quicknode.com/optimism/sepolia',
    amount: '0.05',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: false,
    active: true,
  },

  // ========================================
  // Base Sepolia Faucets
  // ========================================
  {
    name: 'Coinbase Base Sepolia Faucet',
    network: TestnetNetwork.BASE_SEPOLIA,
    type: FaucetType.WEB,
    url: 'https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet',
    amount: '0.1',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: true, // Requires Coinbase account
    active: true,
  },
  {
    name: 'QuickNode Base Sepolia Faucet',
    network: TestnetNetwork.BASE_SEPOLIA,
    type: FaucetType.WEB,
    url: 'https://faucet.quicknode.com/base/sepolia',
    amount: '0.05',
    rateLimit: {
      requests: 1,
      period: 86400,
    },
    requiresAuth: false,
    active: true,
  },
];

/**
 * Get faucets for a specific network
 */
export function getFaucetsForNetwork(network: TestnetNetwork): FaucetConfig[] {
  return FAUCET_CONFIGS.filter(
    (faucet) => faucet.network === network && faucet.active
  );
}

/**
 * Get faucet by name
 */
export function getFaucetByName(name: string): FaucetConfig | undefined {
  return FAUCET_CONFIGS.find((faucet) => faucet.name === name);
}

/**
 * Get all active faucets
 */
export function getActiveFaucets(): FaucetConfig[] {
  return FAUCET_CONFIGS.filter((faucet) => faucet.active);
}

/**
 * Faucet request instructions for each faucet type
 */
export const FAUCET_INSTRUCTIONS = {
  [FaucetType.API]: {
    title: 'API Faucet',
    steps: [
      'Request will be made automatically via API',
      'No user interaction required',
      'Tokens will be sent to your wallet address',
    ],
  },
  [FaucetType.WEB]: {
    title: 'Web Faucet',
    steps: [
      'You will be redirected to the faucet website',
      'Enter your wallet address',
      'Complete any verification (captcha, login, etc.)',
      'Request tokens',
    ],
  },
  [FaucetType.SOCIAL]: {
    title: 'Social Media Faucet',
    steps: [
      'Connect your Twitter/social media account',
      'Tweet or post the required message',
      'Submit your wallet address',
      'Tokens will be sent after verification',
    ],
  },
  [FaucetType.CAPTCHA]: {
    title: 'Captcha Faucet',
    steps: [
      'Enter your wallet address',
      'Complete the captcha verification',
      'Submit request',
      'Tokens will be sent immediately',
    ],
  },
} as const;

/**
 * Expected wait times for different faucet types (in seconds)
 */
export const FAUCET_WAIT_TIMES = {
  [FaucetType.API]: 60, // 1 minute
  [FaucetType.WEB]: 300, // 5 minutes
  [FaucetType.SOCIAL]: 600, // 10 minutes
  [FaucetType.CAPTCHA]: 180, // 3 minutes
} as const;

/**
 * Faucet priority order (higher is better)
 * Used to determine which faucet to try first
 */
export const FAUCET_PRIORITY: Record<string, number> = {
  'QuickNode Sepolia Faucet': 10,
  'Sepolia PoW Faucet': 9,
  'Alchemy Sepolia Faucet': 8,
  'Infura Sepolia Faucet': 7,
  'Polygon Faucet': 10,
  'QuickNode Mumbai Faucet': 9,
  'Alchemy Mumbai Faucet': 8,
  'QuickNode Arbitrum Sepolia Faucet': 10,
  'Optimism Sepolia Faucet': 10,
  'QuickNode Optimism Sepolia Faucet': 9,
  'Coinbase Base Sepolia Faucet': 10,
  'QuickNode Base Sepolia Faucet': 9,
};

/**
 * Get recommended faucet for a network
 * Returns the highest priority active faucet
 */
export function getRecommendedFaucet(network: TestnetNetwork): FaucetConfig | undefined {
  const faucets = getFaucetsForNetwork(network);
  if (faucets.length === 0) return undefined;

  return faucets.sort((a, b) => {
    const priorityA = FAUCET_PRIORITY[a.name] || 0;
    const priorityB = FAUCET_PRIORITY[b.name] || 0;
    return priorityB - priorityA;
  })[0];
}

/**
 * Helper to check if faucet requires authentication
 */
export function requiresAuthentication(faucet: FaucetConfig): boolean {
  return faucet.requiresAuth || false;
}

/**
 * Helper to get expected amount from faucet
 */
export function getExpectedAmount(faucet: FaucetConfig): string {
  return faucet.amount;
}

/**
 * Faucet integration guides (URLs to documentation)
 */
export const FAUCET_GUIDES = {
  'Alchemy Sepolia Faucet': 'https://docs.alchemy.com/docs/how-to-use-sepolia-faucet',
  'Infura Sepolia Faucet': 'https://docs.infura.io/networks/ethereum/how-to/use-the-faucet',
  'Polygon Faucet': 'https://wiki.polygon.technology/docs/tools/faucets/polygon-faucet',
  'Optimism Sepolia Faucet': 'https://docs.optimism.io/builders/tools/faucets',
  'Coinbase Base Sepolia Faucet': 'https://docs.base.org/tools/faucets',
} as const;
