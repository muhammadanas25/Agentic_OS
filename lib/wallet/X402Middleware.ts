/**
 * X402 Middleware
 *
 * Express.js middleware for easy x402 integration
 */

import { X402Manager } from './X402Manager';
import { WalletManager } from './WalletManager';

/**
 * Request with x402 context
 */
export interface X402Request {
  x402?: {
    paymentVerified: boolean;
    amount?: string;
    from?: string;
    txHash?: string;
    invoiceId?: string;
  };
  headers: Record<string, string | string[] | undefined>;
  path: string;
  method: string;
}

/**
 * Response with x402 helpers
 */
export interface X402Response {
  status(code: number): X402Response;
  json(data: any): void;
  set(headers: Record<string, string>): void;
}

/**
 * Next function
 */
export type NextFunction = (err?: any) => void;

/**
 * Middleware options
 */
export interface X402MiddlewareOptions {
  walletAddress: string;
  pricing: Record<string, string>;
  network?: string;
  paymentTimeout?: number;
  skipPaths?: string[];
}

/**
 * Create x402 middleware for Express
 */
export function createX402Middleware(
  walletManager: WalletManager,
  options: X402MiddlewareOptions
) {
  const x402Manager = new X402Manager(walletManager);

  // Register service
  x402Manager.registerService({
    endpoint: '/',
    pricing: options.pricing,
    currency: 'USDC',
    network: options.network as any || 'base-sepolia',
    paymentTimeout: options.paymentTimeout,
  });

  return async (
    req: X402Request,
    res: X402Response,
    next: NextFunction
  ) => {
    // Skip if path is in skipPaths
    if (options.skipPaths?.some((p) => req.path.startsWith(p))) {
      return next();
    }

    // Check if payment proof provided
    const paymentProof = req.headers['x-402-payment-proof'] as string;
    const invoiceId = req.headers['x-402-invoice-id'] as string;

    if (paymentProof && invoiceId) {
      // Verify payment
      try {
        const pricing = options.pricing[req.path] || options.pricing['*'];
        if (!pricing) {
          return res.status(400).json({ error: 'No pricing for this endpoint' });
        }

        const proof = await x402Manager.verifyPayment(
          paymentProof,
          pricing,
          options.walletAddress,
          invoiceId
        );

        // Add payment info to request
        req.x402 = {
          paymentVerified: true,
          amount: proof.amount,
          from: proof.from,
          txHash: proof.txHash,
          invoiceId: proof.invoiceId,
        };

        return next();
      } catch (error: any) {
        return res.status(403).json({
          error: 'Payment verification failed',
          details: error.message,
        });
      }
    }

    // No payment proof - request payment
    const paymentHeaders = x402Manager.generatePaymentRequest(
      req.path,
      options.walletAddress
    );

    res.set(paymentHeaders);
    return res.status(402).json({
      error: 'Payment required',
      message: 'Send payment to proceed',
      paymentInfo: paymentHeaders,
    });
  };
}

/**
 * Decorator for x402-protected routes
 */
export function requiresPayment(amount: string) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: X402Request, res: X402Response) {
      if (!req.x402?.paymentVerified) {
        return res.status(402).json({
          error: 'Payment required',
          amount,
        });
      }

      return originalMethod.apply(this, [req, res]);
    };

    return descriptor;
  };
}
