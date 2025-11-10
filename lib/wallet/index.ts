/**
 * BrowserOS Wallet Library
 *
 * A complete testnet wallet solution for BrowserOS
 *
 * @version 1.0.0
 * @author BrowserOS Team
 * @license MIT
 */

// Core classes
export { WalletManager } from './WalletManager';
export { TestnetProvider } from './TestnetProvider';
export { FaucetWorkflow } from './FaucetWorkflow';
export { WalletStorage } from './WalletStorage';
export { KeyManager } from './KeyManager';
export { TransactionManager } from './TransactionManager';

// Types
export * from './types';

// Configuration
export * from './config';

// Version
export const VERSION = '1.0.0';
