# BrowserOS Wallet - Testnet Token Workflow

A complete, secure, and scalable wallet solution for managing testnet tokens within BrowserOS. This implementation provides end-to-end functionality for wallet creation, testnet token acquisition via faucets, and transaction management.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
  - [Creating a Wallet](#creating-a-wallet)
  - [Importing a Wallet](#importing-a-wallet)
  - [Requesting Testnet Tokens](#requesting-testnet-tokens)
  - [Sending Transactions](#sending-transactions)
- [Supported Networks](#supported-networks)
- [Architecture](#architecture)
- [Security](#security)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Wallet Features
- ✅ **Secure Wallet Creation** - Generate new wallets with BIP39 mnemonic phrases
- ✅ **Wallet Import** - Import existing wallets using mnemonic or private key
- ✅ **HD Wallet Support** - BIP32/44 hierarchical deterministic wallet derivation
- ✅ **Multiple Networks** - Support for Ethereum, Polygon, Arbitrum, Optimism, and Base testnets
- ✅ **Encrypted Storage** - AES-256 encryption for private keys at rest
- ✅ **Balance Tracking** - Real-time balance updates across all networks

### Testnet Faucet Integration
- ✅ **Automated Faucet Requests** - One-click token acquisition from multiple faucets
- ✅ **Multi-Faucet Support** - Integration with popular faucet services
- ✅ **Rate Limit Management** - Smart queuing and retry logic
- ✅ **Transaction Monitoring** - Track faucet transactions until confirmation

### Transaction Management
- ✅ **Transaction History** - Complete history with status tracking
- ✅ **Gas Estimation** - Automatic gas price and limit calculation
- ✅ **Transaction Signing** - Secure in-extension transaction signing
- ✅ **Confirmation Tracking** - Real-time transaction status updates

### Developer Experience
- ✅ **TypeScript Support** - Full type safety with comprehensive interfaces
- ✅ **Modular Architecture** - Easy to extend and customize
- ✅ **Comprehensive Testing** - Unit, integration, and e2e tests
- ✅ **Detailed Documentation** - Architecture docs, API reference, and guides

## Quick Start

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- BrowserOS browser (or Chromium-based browser for development)

### Installation

1. Clone the repository:
```bash
cd /home/user/Agentic_OS/packages/browseros-agent
```

2. Install dependencies:
```bash
npm install
```

3. Build the wallet module:
```bash
npm run build:wallet
```

4. Load the extension in BrowserOS:
   - Open `browseros://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `packages/browseros-agent/dist` directory

### Quick Example

```typescript
import { WalletManager } from './lib/wallet/WalletManager';
import { FaucetWorkflow } from './lib/wallet/FaucetWorkflow';
import { TestnetNetwork } from './lib/wallet/types';

// Initialize wallet manager
const walletManager = new WalletManager();

// Create a new wallet
const wallet = await walletManager.createWallet('your-secure-password');
console.log('Wallet Address:', wallet.address);

// Request testnet tokens from faucet
const faucet = new FaucetWorkflow(walletManager);
const result = await faucet.requestTokens(
  wallet.address,
  TestnetNetwork.SEPOLIA
);

if (result.success) {
  console.log('Tokens requested! TX Hash:', result.txHash);
}

// Check balance
const balance = await walletManager.getBalance(wallet.address);
console.log('Balance:', balance.toString());
```

## Usage Guide

### Creating a Wallet

```typescript
import { WalletManager } from './lib/wallet/WalletManager';

const walletManager = new WalletManager();

// Create a new wallet with password protection
const wallet = await walletManager.createWallet('MySecurePassword123!');

console.log('Address:', wallet.address);
console.log('Mnemonic:', wallet.mnemonic); // SAVE THIS SECURELY!
console.log('Public Key:', wallet.publicKey);

// The wallet is automatically encrypted and stored
```

**Important Security Notes:**
- **NEVER** share your mnemonic phrase with anyone
- **BACKUP** your mnemonic phrase in a secure location
- Use a **STRONG** password (min 12 characters, mixed case, numbers, symbols)
- The mnemonic is shown only once during creation

### Importing a Wallet

#### From Mnemonic Phrase

```typescript
const mnemonic = 'your twelve word mnemonic phrase goes here like this example';
const wallet = await walletManager.importWallet(mnemonic, 'YourPassword123!');

console.log('Imported Address:', wallet.address);
```

#### From Private Key

```typescript
const privateKey = '0x1234567890abcdef...';
const wallet = await walletManager.importFromPrivateKey(
  privateKey,
  'YourPassword123!'
);
```

### Requesting Testnet Tokens

#### Simple Faucet Request

```typescript
import { FaucetWorkflow } from './lib/wallet/FaucetWorkflow';
import { TestnetNetwork } from './lib/wallet/types';

const faucet = new FaucetWorkflow(walletManager);

// Request tokens from Sepolia testnet
const result = await faucet.requestTokens(
  wallet.address,
  TestnetNetwork.SEPOLIA
);

if (result.success) {
  console.log('Transaction Hash:', result.txHash);
  console.log('Expected amount:', result.amount);

  // Wait for confirmation
  await faucet.waitForConfirmation(result.txHash);
  console.log('Tokens received!');
} else {
  console.error('Failed:', result.error);
}
```

#### Advanced Faucet Options

```typescript
const result = await faucet.requestTokens(
  wallet.address,
  TestnetNetwork.SEPOLIA,
  {
    preferredFaucet: 'alchemy',  // Try Alchemy faucet first
    maxRetries: 3,               // Retry up to 3 times
    waitForConfirmation: true,   // Wait for transaction confirmation
    timeout: 300000,             // 5 minute timeout
  }
);
```

#### Multiple Network Requests

```typescript
// Request from multiple networks simultaneously
const networks = [
  TestnetNetwork.SEPOLIA,
  TestnetNetwork.MUMBAI,
  TestnetNetwork.BASE_SEPOLIA
];

const results = await Promise.all(
  networks.map(network =>
    faucet.requestTokens(wallet.address, network)
  )
);

results.forEach((result, i) => {
  console.log(`${networks[i]}: ${result.success ? 'Success' : 'Failed'}`);
});
```

### Sending Transactions

#### Basic Transaction

```typescript
const txHash = await walletManager.sendTransaction({
  from: wallet.address,
  to: '0xRecipientAddress...',
  value: '0.01', // in ETH (or native token)
  network: TestnetNetwork.SEPOLIA
});

console.log('Transaction sent:', txHash);

// Wait for confirmation
const receipt = await walletManager.waitForTransaction(txHash);
console.log('Confirmed in block:', receipt.blockNumber);
```

#### Transaction with Custom Gas

```typescript
const txHash = await walletManager.sendTransaction({
  from: wallet.address,
  to: '0xRecipientAddress...',
  value: '0.01',
  network: TestnetNetwork.SEPOLIA,
  gasLimit: 21000,
  maxFeePerGas: '50', // gwei
  maxPriorityFeePerGas: '2' // gwei
});
```

#### Contract Interaction

```typescript
import { ethers } from 'ethers';

const contract = new ethers.Contract(
  '0xContractAddress...',
  contractABI,
  walletManager.getSigner(wallet.address)
);

// Call contract method
const tx = await contract.transfer(
  '0xRecipient...',
  ethers.utils.parseEther('1.0')
);

await tx.wait();
console.log('Contract interaction confirmed');
```

### Checking Balances

```typescript
// Get balance for current network
const balance = await walletManager.getBalance(wallet.address);
console.log('Balance:', ethers.utils.formatEther(balance), 'ETH');

// Get balance for specific network
const sepoliaBalance = await walletManager.getBalance(
  wallet.address,
  TestnetNetwork.SEPOLIA
);

// Get balances for all networks
const allBalances = await walletManager.getAllBalances(wallet.address);
console.log('Sepolia:', ethers.utils.formatEther(allBalances.sepolia));
console.log('Mumbai:', ethers.utils.formatEther(allBalances.mumbai));
```

### Transaction History

```typescript
// Get transaction history
const history = await walletManager.getTransactionHistory(wallet.address);

history.forEach(tx => {
  console.log(`${tx.hash}: ${tx.status}`);
  console.log(`  From: ${tx.from}`);
  console.log(`  To: ${tx.to}`);
  console.log(`  Value: ${ethers.utils.formatEther(tx.value)} ETH`);
  console.log(`  Timestamp: ${new Date(tx.timestamp).toLocaleString()}`);
});

// Filter by status
const pending = history.filter(tx => tx.status === 'pending');
const confirmed = history.filter(tx => tx.status === 'confirmed');
```

## Supported Networks

### Ethereum Testnets

| Network | Chain ID | RPC URL | Faucet | Block Explorer |
|---------|----------|---------|--------|----------------|
| Sepolia | 11155111 | `https://sepolia.infura.io/v3/{KEY}` | [Alchemy](https://sepoliafaucet.com/) | [Etherscan](https://sepolia.etherscan.io) |
| Goerli* | 5 | `https://goerli.infura.io/v3/{KEY}` | [Goerli Faucet](https://goerlifaucet.com/) | [Etherscan](https://goerli.etherscan.io) |

*Goerli is deprecated; use Sepolia instead.

### Polygon Testnets

| Network | Chain ID | RPC URL | Faucet | Block Explorer |
|---------|----------|---------|--------|----------------|
| Mumbai | 80001 | `https://rpc-mumbai.maticvigil.com` | [Polygon Faucet](https://faucet.polygon.technology/) | [PolygonScan](https://mumbai.polygonscan.com) |

### Layer 2 Testnets

| Network | Chain ID | RPC URL | Faucet | Block Explorer |
|---------|----------|---------|--------|----------------|
| Arbitrum Sepolia | 421614 | `https://sepolia-rollup.arbitrum.io/rpc` | [Arbitrum Faucet](https://faucet.quicknode.com/arbitrum/sepolia) | [Arbiscan](https://sepolia.arbiscan.io) |
| Optimism Sepolia | 11155420 | `https://sepolia.optimism.io` | [Optimism Faucet](https://app.optimism.io/faucet) | [Optimistic](https://sepolia-optimism.etherscan.io) |
| Base Sepolia | 84532 | `https://sepolia.base.org` | [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet) | [BaseScan](https://sepolia.basescan.org) |

### Adding Custom Networks

```typescript
import { NetworkConfig } from './lib/wallet/types';

const customNetwork: NetworkConfig = {
  name: 'My Local Node',
  chainId: 31337,
  rpcUrl: 'http://localhost:8545',
  symbol: 'ETH',
  explorer: 'http://localhost:4000',
  testnet: true
};

await walletManager.addCustomNetwork(customNetwork);
```

## Architecture

The wallet system follows a modular architecture with clear separation of concerns:

```
lib/wallet/
├── WalletManager.ts          # Core wallet operations
├── TestnetProvider.ts        # Network provider management
├── FaucetWorkflow.ts         # Faucet integration logic
├── WalletStorage.ts          # Encrypted storage layer
├── KeyManager.ts             # Key generation and encryption
├── TransactionManager.ts     # Transaction handling
├── types.ts                  # TypeScript interfaces
└── config/
    ├── networks.ts           # Network configurations
    ├── faucets.ts            # Faucet configurations
    └── constants.ts          # App constants
```

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Security

### Key Storage

- **Encryption**: AES-256-GCM for private keys
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Secure Entropy**: `crypto.getRandomValues()` for wallet generation
- **Isolated Context**: Keys never leave the extension background context

### Best Practices

1. **Password Security**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Never reuse passwords from other services

2. **Mnemonic Backup**
   - Write down and store in a secure physical location
   - Never store digitally (screenshots, cloud storage, etc.)
   - Never share with anyone

3. **Transaction Verification**
   - Always verify recipient address
   - Double-check transaction amounts
   - Review gas fees before confirming

4. **Network Safety**
   - Only use trusted RPC providers
   - Verify network URLs before adding custom networks
   - Be cautious with custom tokens and contracts

### Security Audit

This implementation follows security best practices from:
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Web3 Security Best Practices](https://ethereum.org/en/developers/docs/security/)
- [Chrome Extension Security Guidelines](https://developer.chrome.com/docs/extensions/mv3/security/)

**Important**: This is testnet-only software. Do NOT use with mainnet or real funds without proper security audit.

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# RPC Provider API Keys
INFURA_API_KEY=your_infura_key
ALCHEMY_API_KEY=your_alchemy_key
QUICKNODE_API_KEY=your_quicknode_key

# Faucet API Keys (optional)
ALCHEMY_FAUCET_KEY=your_faucet_key

# Feature Flags
ENABLE_MAINNET=false
ENABLE_CUSTOM_NETWORKS=true
ENABLE_TRANSACTION_LOGGING=true

# Security
MIN_PASSWORD_LENGTH=12
MAX_RETRIES=3
SESSION_TIMEOUT=300000  # 5 minutes in ms
```

### User Preferences

Users can configure preferences via the wallet settings UI:

```typescript
interface WalletPreferences {
  defaultNetwork: TestnetNetwork;
  autoRequestFaucet: boolean;
  showNotifications: boolean;
  gasPreference: 'slow' | 'average' | 'fast';
  confirmationBlocks: number;
}
```

## Development

### Project Structure

```
packages/browseros-agent/
├── src/
│   ├── lib/wallet/              # Wallet implementation
│   │   ├── WalletManager.ts
│   │   ├── TestnetProvider.ts
│   │   ├── FaucetWorkflow.ts
│   │   ├── WalletStorage.ts
│   │   ├── KeyManager.ts
│   │   └── types.ts
│   ├── sidepanel/
│   │   └── components/wallet/   # UI components
│   │       ├── WalletDashboard.tsx
│   │       ├── FaucetPanel.tsx
│   │       └── TransactionList.tsx
│   └── background/
│       └── wallet/              # Background services
│           └── WalletService.ts
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
└── docs/
    └── wallet/                  # Documentation
        ├── README.md
        └── ARCHITECTURE.md
```

### Building

```bash
# Development build with watch mode
npm run dev:wallet

# Production build
npm run build:wallet

# Build specific component
npm run build:wallet:manager
npm run build:wallet:ui
```

### Running Locally

```bash
# Start development server
npm run dev

# Load extension in browser
# 1. Open browseros://extensions
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select packages/browseros-agent/dist
```

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure

```typescript
// tests/unit/WalletManager.test.ts
import { WalletManager } from '../../src/lib/wallet/WalletManager';

describe('WalletManager', () => {
  let walletManager: WalletManager;

  beforeEach(() => {
    walletManager = new WalletManager();
  });

  it('should create a new wallet', async () => {
    const wallet = await walletManager.createWallet('TestPassword123!');

    expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(wallet.mnemonic.split(' ')).toHaveLength(12);
  });

  it('should encrypt private key', async () => {
    const wallet = await walletManager.createWallet('TestPassword123!');
    const storage = await walletManager.getStorage();

    expect(storage.wallets[wallet.address].encrypted).toBeDefined();
    expect(storage.wallets[wallet.address].encrypted).not.toContain('0x');
  });
});
```

### Mocking RPC Calls

```typescript
import { jest } from '@jest/globals';

jest.mock('ethers', () => ({
  providers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
      getTransactionCount: jest.fn().mockResolvedValue(5),
      sendTransaction: jest.fn().mockResolvedValue({ hash: '0xabc...' })
    }))
  }
}));
```

## Troubleshooting

### Common Issues

#### 1. "Insufficient funds" Error

**Problem**: Trying to send transaction but balance is too low.

**Solution**:
```typescript
// Check balance before sending
const balance = await walletManager.getBalance(wallet.address);
const txCost = amount + gasLimit * gasPrice;

if (balance.lt(txCost)) {
  console.error('Insufficient funds. Need:', txCost.toString());
  // Request from faucet
  await faucet.requestTokens(wallet.address, TestnetNetwork.SEPOLIA);
}
```

#### 2. "Faucet rate limit exceeded"

**Problem**: Too many faucet requests in short time.

**Solution**:
```typescript
// Check rate limit before requesting
const canRequest = await faucet.checkRateLimit(
  wallet.address,
  TestnetNetwork.SEPOLIA
);

if (!canRequest) {
  const waitTime = await faucet.getWaitTime(wallet.address);
  console.log(`Please wait ${waitTime} seconds before next request`);
}
```

#### 3. "RPC Error: Network Unreachable"

**Problem**: Cannot connect to RPC endpoint.

**Solution**:
```typescript
// Try alternative RPC URLs
const alternativeRpcs = [
  'https://sepolia.infura.io/v3/{KEY}',
  'https://eth-sepolia.g.alchemy.com/v2/{KEY}',
  'https://rpc.sepolia.org'
];

for (const rpcUrl of alternativeRpcs) {
  try {
    await walletManager.switchNetwork(TestnetNetwork.SEPOLIA, { rpcUrl });
    break;
  } catch (error) {
    console.error('Failed:', rpcUrl);
  }
}
```

#### 4. "Transaction Stuck in Pending"

**Problem**: Transaction not confirmed after long time.

**Solution**:
```typescript
// Check transaction status
const tx = await walletManager.getTransaction(txHash);

if (tx.status === 'pending') {
  // Option 1: Wait longer
  await walletManager.waitForTransaction(txHash, 20); // 20 confirmations

  // Option 2: Speed up transaction (replace with higher gas)
  const newTx = await walletManager.speedUpTransaction(txHash);

  // Option 3: Cancel transaction
  const cancelTx = await walletManager.cancelTransaction(txHash);
}
```

### Debug Mode

Enable debug logging:

```typescript
import { WalletManager } from './lib/wallet/WalletManager';

const walletManager = new WalletManager({
  debug: true,
  logLevel: 'debug'
});

// Now all operations will log detailed information
```

### Getting Help

- Check [Issues](https://github.com/anthropics/Agentic_OS/issues) for known problems
- Join our [Discord](https://discord.gg/browseros) for community support
- Read [Architecture Documentation](./ARCHITECTURE.md) for implementation details

## API Reference

### WalletManager

#### Methods

##### `createWallet(password: string): Promise<Wallet>`

Creates a new wallet with a generated mnemonic phrase.

**Parameters:**
- `password` - Password to encrypt the private key (min 12 chars)

**Returns:** Promise resolving to Wallet object

**Example:**
```typescript
const wallet = await walletManager.createWallet('MySecurePass123!');
```

---

##### `importWallet(mnemonic: string, password: string): Promise<Wallet>`

Imports an existing wallet from a mnemonic phrase.

**Parameters:**
- `mnemonic` - 12 or 24 word mnemonic phrase
- `password` - Password to encrypt the private key

**Returns:** Promise resolving to Wallet object

---

##### `getBalance(address: string, network?: TestnetNetwork): Promise<BigNumber>`

Gets the balance for a wallet address.

**Parameters:**
- `address` - Wallet address
- `network` - Network to check (defaults to current network)

**Returns:** Promise resolving to balance in wei

---

##### `sendTransaction(params: TransactionParams): Promise<string>`

Sends a transaction.

**Parameters:**
```typescript
interface TransactionParams {
  from: string;
  to: string;
  value: string;
  network: TestnetNetwork;
  gasLimit?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  data?: string;
}
```

**Returns:** Promise resolving to transaction hash

---

### FaucetWorkflow

#### Methods

##### `requestTokens(address: string, network: TestnetNetwork, options?: FaucetOptions): Promise<FaucetResult>`

Requests testnet tokens from a faucet.

**Parameters:**
- `address` - Wallet address to receive tokens
- `network` - Target network
- `options` - Optional configuration

**Returns:** Promise resolving to FaucetResult

**Example:**
```typescript
const result = await faucet.requestTokens(
  '0x1234...',
  TestnetNetwork.SEPOLIA,
  { waitForConfirmation: true }
);
```

---

### Types

```typescript
interface Wallet {
  address: string;
  publicKey: string;
  mnemonic: string;
  privateKey?: string; // Only available during creation
}

interface FaucetResult {
  success: boolean;
  txHash?: string;
  amount?: string;
  error?: string;
  estimatedTime?: number;
}

enum TestnetNetwork {
  SEPOLIA = 'sepolia',
  MUMBAI = 'mumbai',
  ARBITRUM_SEPOLIA = 'arb-sepolia',
  OPTIMISM_SEPOLIA = 'op-sepolia',
  BASE_SEPOLIA = 'base-sepolia'
}
```

For complete API documentation, see the inline TypeScript documentation in the source files.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit with conventional commits: `git commit -m "feat: add new feature"`
7. Push to your fork: `git push origin feature/my-feature`
8. Open a Pull Request

### Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] All tests pass
- [ ] New features have unit tests
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Error handling is comprehensive

## Roadmap

### v1.0 (Current)
- ✅ Basic wallet creation and import
- ✅ Testnet support (Sepolia, Mumbai)
- ✅ Faucet integration
- ✅ Transaction management
- ✅ Balance tracking

### v1.1 (Next)
- [ ] Additional testnets (Arbitrum, Optimism, Base)
- [ ] Enhanced faucet integrations
- [ ] Transaction batching
- [ ] Multi-wallet support
- [ ] Improved UI/UX

### v2.0 (Future)
- [ ] ERC-20 token support
- [ ] NFT support
- [ ] Hardware wallet integration
- [ ] WalletConnect support
- [ ] Advanced gas management

### v3.0 (Long-term)
- [ ] Mainnet support (with enhanced security)
- [ ] DeFi integrations
- [ ] Multi-signature wallets
- [ ] Portfolio tracking

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Acknowledgments

- [ethers.js](https://docs.ethers.io/) - Ethereum library
- [BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) - Mnemonic code for generating deterministic keys
- [Web3.js](https://web3js.readthedocs.io/) - Ethereum JavaScript API
- Community faucet providers (Alchemy, Infura, QuickNode)

## Support

- Documentation: [docs/wallet/](./ARCHITECTURE.md)
- Issues: [GitHub Issues](https://github.com/anthropics/Agentic_OS/issues)
- Discord: [BrowserOS Community](https://discord.gg/browseros)
- Email: support@browseros.com

---

**⚠️ Important Security Notice**

This wallet is designed for TESTNET use only. Do not use with mainnet networks or real cryptocurrency. Always practice proper security hygiene:
- Never share your private keys or mnemonic
- Use strong, unique passwords
- Backup your wallet securely
- Verify all transactions before confirming

**Happy building! 🚀**
