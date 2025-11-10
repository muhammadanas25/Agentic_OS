/**
 * Key Manager
 *
 * Handles encryption and decryption of private keys using Web Crypto API
 */

import { EncryptionResult, KeyDerivationOptions } from './types';
import { ENCRYPTION, KEY_DERIVATION } from './config';

/**
 * Key manager for cryptographic operations
 */
export class KeyManager {
  /**
   * Encrypt a private key with password
   */
  async encrypt(
    privateKey: string,
    password: string
  ): Promise<EncryptionResult> {
    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(ENCRYPTION.SALT_LENGTH));

    // Derive key from password
    const key = await this.deriveKey(password, salt);

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION.IV_LENGTH));

    // Encrypt private key
    const encoder = new TextEncoder();
    const data = encoder.encode(privateKey);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION.ALGORITHM,
        iv,
      },
      key,
      data
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return {
      encrypted: this.bufferToHex(combined),
      salt: this.bufferToHex(salt),
      iv: this.bufferToHex(iv),
    };
  }

  /**
   * Decrypt a private key with password
   */
  async decrypt(
    encryptedHex: string,
    password: string,
    saltHex: string
  ): Promise<string> {
    // Parse encrypted data (format: iv + encrypted)
    const combined = this.hexToBuffer(encryptedHex);
    const iv = new Uint8Array(combined.slice(0, ENCRYPTION.IV_LENGTH));
    const encrypted = new Uint8Array(combined.slice(ENCRYPTION.IV_LENGTH));

    // Derive key from password
    const salt = this.hexToBuffer(saltHex);
    const key = await this.deriveKey(password, new Uint8Array(salt));

    try {
      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: ENCRYPTION.ALGORITHM,
          iv,
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      throw new Error('Decryption failed. Invalid password or corrupted data.');
    }
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  private async deriveKey(
    password: string,
    salt: Uint8Array,
    options: KeyDerivationOptions = {}
  ): Promise<CryptoKey> {
    const iterations = options.iterations || KEY_DERIVATION.ITERATIONS;

    // Import password as key
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations,
        hash: KEY_DERIVATION.DIGEST,
      },
      passwordKey,
      {
        name: ENCRYPTION.ALGORITHM,
        length: ENCRYPTION.KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Convert ArrayBuffer or Uint8Array to hex string
   */
  private bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to ArrayBuffer
   */
  private hexToBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }
}
