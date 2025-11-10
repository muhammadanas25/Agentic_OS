# Wallet & Testnet Token Workflow - Architecture

## Overview

The BrowserOS Wallet system provides a complete end-to-end workflow for managing testnet tokens within the browser environment. This architecture is designed to be scalable, secure, and extensible for future blockchain integrations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     BrowserOS Browser                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Chrome Extension Layer                    │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           Wallet UI Components                   │  │  │
│  │  │  - Wallet Dashboard                             │  │  │
│  │  │  - Faucet Request Panel                         │  │  │
│  │  │  - Transaction History                          │  │  │
│  │  │  - Token Balance Display                        │  │  │
│  │  └─────────────────┬───────────────────────────────┘  │  │
│  │                    │                                   │  │
│  │  ┌─────────────────▼───────────────────────────────┐  │  │
│  │  │         Wallet Manager (Core Logic)             │  │  │
│  │  │  - Wallet Creation/Import                       │  │  │
│  │  │  - Key Management (Secure Storage)              │  │  │
│  │  │  - Transaction Signing                          │  │  │
│  │  │  - Account Management                           │  │  │
│  │  └─────────────────┬───────────────────────────────┘  │  │
│  │                    │                                   │  │
│  │  ┌─────────────────▼───────────────────────────────┐  │  │
│  │  │         Testnet Provider Layer                  │  │  │
│  │  │  - RPC Client (ethers.js/web3.js)              │  │  │
│  │  │  - Network Configuration                        │  │  │
│  │  │  - Transaction Broadcasting                     │  │  │
│  │  │  - Event Monitoring                             │  │  │
│  │  └─────────────────┬───────────────────────────────┘  │  │
│  │                    │                                   │  │
│  │  ┌─────────────────▼───────────────────────────────┐  │  │
│  │  │         Faucet Workflow Engine                  │  │  │
│  │  │  - Faucet Detection & Integration              │  │  │
│  │  │  - Automated Token Requests                     │  │  │
│  │  │  - Rate Limiting & Queue Management            │  │  │
│  │  │  - Multi-Network Support                        │  │  │
│  │  └─────────────────┬───────────────────────────────┘  │  │
│  │                    │                                   │  │
│  │  ┌─────────────────▼───────────────────────────────┐  │  │
│  │  │         Storage Layer (Preferences)             │  │  │
│  │  │  - Encrypted Wallet Storage                     │  │  │
│  │  │  - Network Configurations                       │  │  │
│  │  │  - Transaction Cache                            │  │  │
│  │  │  - User Preferences                             │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ HTTPS/WSS
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                  External Services Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Testnet RPC    │  │  Faucet APIs    │  │  Block      │ │
│  │  Nodes          │  │  (Various)      │  │  Explorers  │ │
│  │  - Sepolia      │  │  - Sepolia      │  │  - Etherscan│ │
│  │  - Goerli       │  │  - Alchemy      │  │  - Blockscout│
│  │  - Mumbai       │  │  - Infura       │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Wallet Manager (`WalletManager.ts`)

**Responsibilities:**
- Wallet lifecycle management (create, import, export)
- Secure key storage using browser's encryption APIs
- Account derivation (HD wallet support)
- Transaction signing and broadcasting
- Balance tracking and updates

**Key Methods:**
```typescript
- createWallet(password: string): Promise<Wallet>
- importWallet(mnemonic: string, password: string): Promise<Wallet>
- signTransaction(tx: Transaction): Promise<SignedTransaction>
- getBalance(address: string): Promise<BigNumber>
- sendTransaction(to: string, amount: BigNumber): Promise<TransactionReceipt>
```

**Security Considerations:**
- Private keys never leave the extension context
- Encryption at rest using AES-256
- Password-based key derivation (PBKDF2)
- Secure entropy generation for wallet creation

### 2. Testnet Provider (`TestnetProvider.ts`)

**Responsibilities:**
- RPC connection management
- Network switching and configuration
- Transaction broadcasting
- Event subscription and monitoring
- Gas estimation and fee calculation

**Supported Networks:**
```typescript
enum TestnetNetwork {
  SEPOLIA = 'sepolia',           // Ethereum Sepolia
  GOERLI = 'goerli',             // Ethereum Goerli (deprecated)
  MUMBAI = 'mumbai',             // Polygon Mumbai
  ARBITRUM_SEPOLIA = 'arb-sepolia',
  OPTIMISM_SEPOLIA = 'op-sepolia',
  BASE_SEPOLIA = 'base-sepolia'
}
```

**Provider Interface:**
```typescript
interface ITestnetProvider {
  connect(network: TestnetNetwork): Promise<void>
  disconnect(): Promise<void>
  getBlockNumber(): Promise<number>
  getGasPrice(): Promise<BigNumber>
  sendRawTransaction(signedTx: string): Promise<string>
  waitForTransaction(txHash: string): Promise<TransactionReceipt>
}
```

### 3. Faucet Workflow Engine (`FaucetWorkflow.ts`)

**Responsibilities:**
- Discover available faucets for each network
- Automate faucet requests with retry logic
- Handle different faucet authentication mechanisms (captcha, social, API)
- Queue management for multiple requests
- Track request history and rate limits

**Faucet Integration Types:**
```typescript
enum FaucetType {
  API = 'api',              // Direct API integration
  WEB = 'web',              // Browser automation
  SOCIAL = 'social',        // Social media verification
  CAPTCHA = 'captcha'       // Captcha-based
}
```

**Workflow Steps:**
1. User selects network and initiates faucet request
2. System detects available faucets for the network
3. Prioritizes faucets by success rate and availability
4. Executes request with appropriate authentication
5. Monitors transaction until confirmation
6. Updates balance and notifies user

### 4. Storage Layer (`WalletStorage.ts`)

**Responsibilities:**
- Persistent storage of encrypted wallet data
- Network configuration management
- Transaction history caching
- User preferences and settings

**Storage Schema:**
```typescript
interface WalletStorageSchema {
  version: string;
  wallets: {
    [address: string]: {
      encrypted: string;        // Encrypted private key
      publicKey: string;
      derivationPath?: string;
      createdAt: number;
      lastUsed: number;
    }
  };
  networks: {
    [network: string]: {
      rpcUrl: string;
      chainId: number;
      symbol: string;
      explorer: string;
    }
  };
  transactions: {
    [txHash: string]: {
      from: string;
      to: string;
      value: string;
      timestamp: number;
      status: 'pending' | 'confirmed' | 'failed';
    }
  };
  preferences: {
    defaultNetwork: TestnetNetwork;
    autoRequestFaucet: boolean;
    showNotifications: boolean;
  }
}
```

## Data Flow

### Wallet Creation Flow

```
User Input (Password)
    │
    ▼
Generate Entropy (crypto.getRandomValues)
    │
    ▼
Create Mnemonic (BIP39)
    │
    ▼
Derive HD Wallet (BIP32/44)
    │
    ▼
Extract Private/Public Keys
    │
    ▼
Encrypt Private Key (AES-256 + PBKDF2)
    │
    ▼
Store in Extension Storage
    │
    ▼
Return Wallet Address
```

### Faucet Request Flow

```
User Initiates Request
    │
    ▼
Select Target Network
    │
    ▼
Query Available Faucets
    │
    ▼
Check Rate Limits
    │
    ├─ Rate Limited → Queue Request
    │
    └─ Available → Execute Request
           │
           ▼
    Authenticate (if needed)
           │
           ▼
    Submit Wallet Address
           │
           ▼
    Receive Transaction Hash
           │
           ▼
    Monitor Transaction Status
           │
           ├─ Pending → Continue Polling
           │
           └─ Confirmed → Update Balance
                  │
                  ▼
           Notify User (Success)
```

### Transaction Flow

```
User Initiates Transaction
    │
    ▼
Validate Input (address, amount)
    │
    ▼
Estimate Gas Fees
    │
    ▼
Build Transaction Object
    │
    ▼
Sign with Private Key (in secure context)
    │
    ▼
Broadcast to Network (via RPC)
    │
    ▼
Receive Transaction Hash
    │
    ▼
Store in Transaction Cache
    │
    ▼
Monitor Confirmation
    │
    ├─ Pending → Update UI
    │
    └─ Confirmed → Update Balance & History
```

## Security Architecture

### Key Management

1. **Generation:**
   - Use `crypto.getRandomValues()` for secure entropy
   - BIP39 for mnemonic generation
   - BIP32/44 for HD wallet derivation

2. **Storage:**
   - Private keys encrypted with AES-256-GCM
   - Password-based key derivation (PBKDF2, 100k iterations)
   - Salt unique per wallet
   - Encrypted data stored in Chrome's extension storage

3. **Usage:**
   - Keys decrypted only when needed for signing
   - Never exposed to content scripts or web pages
   - Signing happens in background service worker
   - Memory cleared after use

### Attack Surface Mitigation

| Attack Vector | Mitigation Strategy |
|--------------|---------------------|
| XSS | Content Security Policy, isolated extension context |
| Man-in-the-Middle | HTTPS enforcement, certificate pinning for RPC |
| Phishing | UI warnings, address verification |
| Keylogging | Password input via native inputs, no logging |
| Storage Extraction | Encryption at rest, extension permissions |
| Code Injection | Strict CSP, no eval(), sandboxed iframes |

## Scalability Considerations

### 1. Multi-Network Support

**Current Implementation:**
- Designed for easy addition of new networks
- Configuration-driven network management
- Abstract provider interface

**Adding New Network:**
```typescript
// In config/networks.ts
export const NETWORKS = {
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/{API_KEY}',
    symbol: 'ETH',
    explorer: 'https://sepolia.etherscan.io'
  },
  // Add new network here
  NEW_TESTNET: {
    chainId: 12345,
    name: 'New Testnet',
    rpcUrl: 'https://rpc.newtestnet.io',
    symbol: 'NTT',
    explorer: 'https://explorer.newtestnet.io'
  }
}
```

### 2. Faucet Integration

**Plugin Architecture:**
```typescript
interface FaucetPlugin {
  name: string;
  network: TestnetNetwork;
  type: FaucetType;
  request(address: string): Promise<FaucetResponse>;
  checkRateLimit(address: string): Promise<boolean>;
}

// Easily add new faucet integrations
class AlchemyFaucet implements FaucetPlugin {
  // Implementation
}

class InfuraFaucet implements FaucetPlugin {
  // Implementation
}
```

### 3. Token Support

**Future Enhancement:**
- Currently supports native tokens (ETH, MATIC)
- Designed for ERC-20 token support
- Token registry pattern

```typescript
interface Token {
  address: string;
  symbol: string;
  decimals: number;
  network: TestnetNetwork;
}

class TokenManager {
  async addToken(token: Token): Promise<void>
  async getBalance(token: Token, address: string): Promise<BigNumber>
  async transfer(token: Token, to: string, amount: BigNumber): Promise<Receipt>
}
```

## Extension Points

### 1. Custom RPC Providers

Users can add custom RPC endpoints:

```typescript
walletManager.addCustomNetwork({
  name: 'My Local Node',
  chainId: 31337,
  rpcUrl: 'http://localhost:8545'
});
```

### 2. Faucet Plugins

Developers can register custom faucet integrations:

```typescript
faucetWorkflow.registerPlugin(new CustomFaucet({
  name: 'My Faucet',
  apiUrl: 'https://api.myfaucet.com',
  requestHandler: async (address) => { /* logic */ }
}));
```

### 3. Transaction Hooks

Allow custom logic before/after transactions:

```typescript
walletManager.onBeforeTransaction((tx) => {
  // Validate, modify, or reject transaction
  return tx;
});

walletManager.onAfterTransaction((receipt) => {
  // Analytics, notifications, etc.
});
```

## Performance Considerations

### 1. Caching Strategy

- **Balance Caching:** 30-second TTL, invalidate on transaction
- **Transaction History:** Local cache with pagination
- **Gas Prices:** 15-second cache with auto-refresh
- **Network Data:** Cache block headers for quick sync

### 2. Background Sync

```typescript
// Service worker pattern for background updates
chrome.alarms.create('balanceUpdate', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'balanceUpdate') {
    walletManager.updateAllBalances();
  }
});
```

### 3. Lazy Loading

- UI components loaded on demand
- Provider connections established only when needed
- Transaction history paginated (20 per page)

## Error Handling

### Error Categories

```typescript
enum WalletErrorCode {
  // Network Errors
  NETWORK_UNREACHABLE = 'E001',
  RPC_ERROR = 'E002',
  TIMEOUT = 'E003',

  // Wallet Errors
  INVALID_PASSWORD = 'E101',
  WALLET_LOCKED = 'E102',
  INSUFFICIENT_FUNDS = 'E103',

  // Transaction Errors
  INVALID_ADDRESS = 'E201',
  GAS_ESTIMATION_FAILED = 'E202',
  TRANSACTION_FAILED = 'E203',

  // Faucet Errors
  RATE_LIMIT_EXCEEDED = 'E301',
  FAUCET_UNAVAILABLE = 'E302',
  FAUCET_EMPTY = 'E303'
}
```

### Retry Logic

```typescript
interface RetryConfig {
  maxRetries: number;
  backoff: 'linear' | 'exponential';
  initialDelay: number;
  maxDelay: number;
}

// Exponential backoff for network errors
const NETWORK_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoff: 'exponential',
  initialDelay: 1000,    // 1s
  maxDelay: 30000        // 30s
};
```

## Monitoring & Observability

### Metrics to Track

```typescript
interface WalletMetrics {
  // Usage Metrics
  walletsCreated: number;
  transactionsSubmitted: number;
  faucetRequestsSuccessful: number;
  faucetRequestsFailed: number;

  // Performance Metrics
  avgTransactionTime: number;
  avgFaucetResponseTime: number;
  rpcLatency: number;

  // Error Metrics
  errorsByType: Record<WalletErrorCode, number>;
  networkFailures: number;
}
```

### Logging Strategy

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class WalletLogger {
  log(level: LogLevel, message: string, context?: any) {
    // Log to console in dev
    // Send to analytics in prod (privacy-respecting)
  }
}
```

## Testing Strategy

### 1. Unit Tests
- Wallet creation and import
- Transaction signing
- Balance calculations
- Encryption/decryption

### 2. Integration Tests
- RPC provider interactions
- Faucet workflows
- End-to-end transaction flows

### 3. Security Tests
- Encryption strength validation
- Key derivation correctness
- XSS/injection prevention

### 4. Performance Tests
- Load testing (1000+ transactions)
- Concurrent balance updates
- Memory leak detection

## Future Enhancements

### Phase 2: Advanced Features
1. **Multi-signature Wallets** - Support for shared accounts
2. **Hardware Wallet Integration** - Ledger/Trezor support
3. **DeFi Integration** - Swap, lending, staking
4. **NFT Support** - Display and transfer NFTs
5. **Transaction Batching** - Bundle multiple transactions
6. **Custom Token Support** - ERC-20, ERC-721, ERC-1155

### Phase 3: Mainnet Support
1. **Mainnet Networks** - Ethereum, Polygon, Arbitrum, etc.
2. **Enhanced Security** - Biometric authentication, 2FA
3. **Advanced Gas Management** - EIP-1559 support, gas optimization
4. **Portfolio Tracking** - Multi-wallet, multi-network overview
5. **DApp Integration** - WalletConnect, Web3Modal

## Conclusion

This architecture provides a solid foundation for testnet token management while maintaining security, scalability, and extensibility. The modular design allows for easy addition of new networks, faucets, and features without requiring significant refactoring.

**Key Principles:**
- ✅ Security-first design
- ✅ Modular and extensible
- ✅ Performance-optimized
- ✅ Developer-friendly
- ✅ User-centric UX
