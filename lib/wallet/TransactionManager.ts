/**
 * Transaction Manager
 *
 * Handles transaction building, signing, and broadcasting
 */

import { ethers } from 'ethers';
import { TransactionParams } from './types';
import { TestnetProvider } from './TestnetProvider';

/**
 * Transaction manager for building and sending transactions
 */
export class TransactionManager {
  constructor(private provider: TestnetProvider) {}

  /**
   * Send a transaction
   */
  async sendTransaction(
    wallet: ethers.Wallet,
    params: TransactionParams
  ): Promise<string> {
    // Build transaction
    const tx = await this.buildTransaction(params);

    // Connect wallet to provider
    const connectedWallet = wallet.connect(this.provider.getProvider());

    // Sign and send
    const signedTx = await connectedWallet.sendTransaction(tx);

    return signedTx.hash;
  }

  /**
   * Build transaction object
   */
  private async buildTransaction(
    params: TransactionParams
  ): Promise<ethers.providers.TransactionRequest> {
    const tx: ethers.providers.TransactionRequest = {
      from: params.from,
      to: params.to,
      value: ethers.utils.parseEther(params.value),
      data: params.data || '0x',
    };

    // Get nonce
    if (params.nonce !== undefined) {
      tx.nonce = params.nonce;
    } else {
      tx.nonce = await this.provider.getTransactionCount(params.from);
    }

    // Handle gas
    if (params.gasLimit) {
      tx.gasLimit = params.gasLimit;
    } else {
      tx.gasLimit = await this.provider.estimateGas(params);
    }

    // Handle gas price (EIP-1559 or legacy)
    if (params.maxFeePerGas && params.maxPriorityFeePerGas) {
      tx.maxFeePerGas = ethers.utils.parseUnits(params.maxFeePerGas, 'gwei');
      tx.maxPriorityFeePerGas = ethers.utils.parseUnits(
        params.maxPriorityFeePerGas,
        'gwei'
      );
    } else {
      const gasPrice = await this.provider.getGasPrice();
      tx.gasPrice = gasPrice.average;
    }

    return tx;
  }
}
