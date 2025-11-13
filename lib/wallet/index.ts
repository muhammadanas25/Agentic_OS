/**
 * BrowserOS Wallet Library
 *
 * A complete testnet wallet solution for BrowserOS with x402 agent payments
 *
 * @version 2.0.0
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

// x402 Payment Protocol
export { X402Manager } from './X402Manager';
export { TokenManager, USDC_ADDRESSES, TOKEN_METADATA } from './TokenManager';
export { createX402Middleware, requiresPayment } from './X402Middleware';

// x402 Types
export type {
  X402PaymentRequest,
  X402PaymentResponse,
  X402ServiceConfig,
  X402PaymentProof,
  X402ManagerOptions,
} from './X402Manager';

export type {
  X402Request,
  X402Response,
  X402MiddlewareOptions,
} from './X402Middleware';

// Core Types
export * from './types';

// Configuration
export * from './config';

// Version
export const VERSION = '2.0.0';
