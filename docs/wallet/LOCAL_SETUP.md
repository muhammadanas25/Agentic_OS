# BrowserOS Local Setup Guide

Complete guide to setting up BrowserOS and the wallet system locally for development.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Repository Structure](#repository-structure)
4. [Setting Up the Wallet Library](#setting-up-the-wallet-library)
5. [Building BrowserOS Browser](#building-browseros-browser)
6. [Running Examples](#running-examples)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)
9. [Environment Configuration](#environment-configuration)

---

## Prerequisites

### Required Software

```bash
# Node.js (v18 or higher)
node --version  # Should be >= 18.0.0

# npm (v9 or higher)
npm --version   # Should be >= 9.0.0

# Git
git --version

# Python 3 (for browser build)
python3 --version  # Should be >= 3.8
```

### Installation

#### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Install Python
brew install python@3.11
```

#### Ubuntu/Debian

```bash
# Update package list
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python
sudo apt install -y python3 python3-pip

# Install build tools
sudo apt install -y build-essential git
```

#### Windows

```powershell
# Install via Chocolatey
choco install nodejs-lts python git

# Or download installers:
# Node.js: https://nodejs.org/
# Python: https://www.python.org/downloads/
# Git: https://git-scm.com/download/win
```

---

## Quick Start

### 1. Clone the Repository

```bash
# Clone with submodules
git clone --recursive https://github.com/anthropics/Agentic_OS.git

cd Agentic_OS

# If you forgot --recursive, initialize submodules
git submodule update --init --recursive
```

### 2. Install Wallet Library Dependencies

```bash
cd lib/wallet

# Install dependencies
npm install

# Build the library
npm run build

# Verify build
ls dist/
# Should see: index.js, index.d.ts, and other compiled files
```

### 3. Run Example

```bash
# Run the wallet example
node dist/example.js
```

**Expected Output:**
```
=== BrowserOS Wallet Example ===

1. Initializing Wallet Manager...
   ✓ Wallet Manager initialized

2. Creating a new wallet...
   ✓ Wallet created!
   Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   Mnemonic: abandon abandon abandon ... (12 words)
   ⚠️  SAVE YOUR MNEMONIC PHRASE SECURELY!

3. Connecting to Sepolia testnet...
   ✓ Connected to Sepolia
...
```

---

## Repository Structure

```
Agentic_OS/
├── lib/
│   └── wallet/                    # Wallet library (our focus)
│       ├── WalletManager.ts       # Core wallet operations
│       ├── TestnetProvider.ts     # Network connectivity
│       ├── FaucetWorkflow.ts      # Testnet token acquisition
│       ├── X402Manager.ts         # x402 payment protocol (NEW)
│       ├── TokenManager.ts        # ERC-20 token support (NEW)
│       ├── config/                # Configuration files
│       │   ├── networks.ts        # Network definitions
│       │   ├── faucets.ts         # Faucet configurations
│       │   └── constants.ts       # App constants
│       ├── examples/              # Example code
│       │   ├── basic.ts          # Basic wallet usage
│       │   └── x402/             # x402 examples (NEW)
│       ├── package.json
│       ├── tsconfig.json
│       └── dist/                  # Compiled output
│
├── packages/
│   ├── browseros/                 # Browser implementation
│   │   ├── build/                 # Build system
│   │   └── chromium_patches/      # Browser modifications
│   │
│   └── browseros-agent/           # Agent extension (submodule)
│
├── docs/
│   └── wallet/                    # Documentation
│       ├── BLOCKCHAIN_101.md      # Blockchain basics
│       ├── X402_GUIDE.md          # x402 protocol guide
│       ├── README.md              # Wallet user guide
│       ├── ARCHITECTURE.md        # Technical architecture
│       └── LOCAL_SETUP.md         # This file
│
└── scripts/                       # Utility scripts
```

---

## Setting Up the Wallet Library

### Development Setup

```bash
cd lib/wallet

# Install dependencies
npm install

# Start development mode (watches for changes)
npm run dev
```

**In another terminal:**
```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint

# Format code
npm run format
```

### Project Dependencies

**Production:**
```json
{
  "ethers": "^5.7.2"  // Ethereum library
}
```

**Development:**
```json
{
  "@types/node": "^18.0.0",
  "@types/chrome": "^0.0.246",
  "typescript": "^5.0.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0"
}
```

### Building

```bash
# Production build
npm run build

# Output: dist/ directory with:
# - index.js (compiled JavaScript)
# - index.d.ts (TypeScript definitions)
# - All other compiled modules
```

### Using in Your Project

```bash
# In your project directory
npm install /path/to/Agentic_OS/lib/wallet

# Or publish to npm registry
cd lib/wallet
npm publish
```

---

## Building BrowserOS Browser

### Prerequisites

```bash
# Chromium source (100+ GB, optional)
# Only needed if building the full browser

# For macOS
xcode-select --install

# For Ubuntu/Debian
sudo apt install -y \
  build-essential \
  clang \
  lld \
  ninja-build \
  pkg-config \
  libnss3-dev \
  libglib2.0-dev
```

### Build Configuration

```bash
cd packages/browseros

# Configure build
python3 build/build.py \
  --config build/config/debug.yaml \
  --chromium-src /path/to/chromium/src \
  --configure

# Build
python3 build/build.py \
  --config build/config/debug.yaml \
  --chromium-src /path/to/chromium/src \
  --build
```

### Development Without Full Browser Build

**Option 1: Use Chrome/Chromium**
```bash
# Load wallet library in standard Chrome
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Load lib/wallet as unpacked extension
```

**Option 2: Use Node.js**
```bash
# Run wallet library in Node.js
cd lib/wallet
node dist/example.js
```

---

## Running Examples

### Example 1: Basic Wallet Operations

```bash
cd lib/wallet

# Build if not already built
npm run build

# Run basic example
node dist/example.js
```

**What it does:**
1. Creates a new wallet
2. Connects to Sepolia testnet
3. Requests tokens from faucet
4. Checks balance
5. Sends a test transaction

### Example 2: x402 Payment Provider

```bash
# Run x402 provider example
node dist/examples/x402/provider.js
```

**What it does:**
1. Sets up an agent that provides image analysis
2. Accepts x402 payments
3. Monitors incoming payments
4. Provides service after payment verification

### Example 3: x402 Payment Consumer

```bash
# Run x402 consumer example
node dist/examples/x402/consumer.js
```

**What it does:**
1. Creates consumer agent wallet
2. Discovers available services
3. Makes x402-enabled requests
4. Pays automatically
5. Receives service response

### Example 4: Multi-Agent System

```bash
# Start provider agents
node dist/examples/x402/agents/image-analyzer.js &
node dist/examples/x402/agents/data-fetcher.js &

# Run orchestrator agent
node dist/examples/x402/agents/orchestrator.js
```

**What it does:**
1. Multiple specialized agents provide services
2. Orchestrator agent coordinates and pays for services
3. Demonstrates agent-to-agent payments

---

## Development Workflow

### Typical Day

```bash
# 1. Pull latest changes
git pull origin main
git submodule update --remote

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Start development mode
cd lib/wallet
npm run dev  # Watches for changes and rebuilds

# 4. Make changes to TypeScript files
# Files auto-compile on save

# 5. Test changes
node dist/example.js

# 6. Run tests
npm test

# 7. Format code
npm run format

# 8. Commit changes
git add .
git commit -m "feat: Add new feature"

# 9. Push to remote
git push origin feature/my-feature
```

### Code Style

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true
  }
}
```

**ESLint Rules:**
- No unused variables
- Prefer const over let
- Use async/await over promises
- Explicit return types on functions

**Prettier Config:**
```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true
}
```

### Git Workflow

```bash
# Main branches
main          # Production-ready code
develop       # Integration branch

# Feature branches
feature/*     # New features
fix/*         # Bug fixes
docs/*        # Documentation
refactor/*    # Code refactoring

# Example
git checkout -b feature/x402-streaming-payments
```

---

## Troubleshooting

### Common Issues

#### 1. `ethers` Module Not Found

**Error:**
```
Cannot find module 'ethers'
```

**Solution:**
```bash
cd lib/wallet
npm install
```

#### 2. TypeScript Compilation Errors

**Error:**
```
error TS6133: 'variable' is declared but its value is never read
```

**Solution:**
```bash
# Prefix unused parameters with underscore
function example(_unusedParam: string) { }

# Or disable specific rules in tsconfig.json
```

#### 3. Node Version Mismatch

**Error:**
```
The engine "node" is incompatible with this module
```

**Solution:**
```bash
# Check Node version
node --version

# Install Node 18 or higher
nvm install 18
nvm use 18
```

#### 4. Permission Errors

**Error:**
```
EACCES: permission denied
```

**Solution:**
```bash
# Don't use sudo with npm install
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

#### 5. Git Submodule Not Initialized

**Error:**
```
packages/browseros-agent is empty
```

**Solution:**
```bash
git submodule update --init --recursive
```

#### 6. Build Fails with Memory Error

**Error:**
```
JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Debug Mode

```typescript
// Enable debug logging
const walletManager = new WalletManager({
  debug: true,
  logLevel: LogLevel.DEBUG
});

// Check console for detailed logs
```

### Getting Help

**Check these first:**
1. [GitHub Issues](https://github.com/anthropics/Agentic_OS/issues)
2. [Documentation](../README.md)
3. [Discord Community](https://discord.gg/browseros)

**Create an issue:**
```bash
# Include this information:
- Node version: node --version
- npm version: npm --version
- OS: uname -a
- Error message: (copy/paste full error)
- Steps to reproduce
```

---

## Environment Configuration

### Environment Variables

Create `.env` file in `lib/wallet/`:

```bash
# RPC Provider API Keys
INFURA_API_KEY=your_infura_project_id
ALCHEMY_API_KEY=your_alchemy_api_key
QUICKNODE_API_KEY=your_quicknode_endpoint_url

# Faucet API Keys (optional)
ALCHEMY_FAUCET_KEY=your_faucet_api_key

# Feature Flags
ENABLE_MAINNET=false
ENABLE_CUSTOM_NETWORKS=true
ENABLE_TRANSACTION_LOGGING=true

# Debug Settings
DEBUG=true
LOG_LEVEL=debug

# x402 Settings
X402_ENABLE=true
X402_DEFAULT_NETWORK=base-sepolia
X402_DEFAULT_CURRENCY=USDC
```

### Getting API Keys

#### Infura
```bash
1. Visit https://infura.io
2. Sign up for free account
3. Create new project
4. Copy Project ID
5. Add to .env: INFURA_API_KEY=<project-id>
```

#### Alchemy
```bash
1. Visit https://alchemy.com
2. Create free account
3. Create app → Choose Ethereum → Sepolia
4. Copy API key
5. Add to .env: ALCHEMY_API_KEY=<api-key>
```

#### QuickNode
```bash
1. Visit https://quicknode.com
2. Create free account
3. Create endpoint → Choose network
4. Copy HTTP endpoint URL
5. Add to .env: QUICKNODE_API_KEY=<endpoint-url>
```

### Using Environment Variables

```typescript
// In code
import dotenv from 'dotenv';
dotenv.config();

const rpcUrl = process.env.INFURA_API_KEY
  ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
  : 'https://rpc.sepolia.org'; // Fallback
```

---

## Testing

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- WalletManager.test.ts

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure

```
lib/wallet/
└── tests/
    ├── unit/
    │   ├── WalletManager.test.ts
    │   ├── KeyManager.test.ts
    │   └── TokenManager.test.ts
    ├── integration/
    │   ├── faucet.test.ts
    │   └── x402.test.ts
    └── e2e/
        └── full-workflow.test.ts
```

### Writing Tests

```typescript
// tests/unit/WalletManager.test.ts
import { WalletManager } from '../WalletManager';

describe('WalletManager', () => {
  let wallet: WalletManager;

  beforeEach(() => {
    wallet = new WalletManager();
  });

  it('creates wallet with valid mnemonic', async () => {
    const w = await wallet.createWallet('TestPass123!');
    expect(w.mnemonic.split(' ')).toHaveLength(12);
    expect(w.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});
```

---

## Performance Tips

### 1. Use Production Build

```bash
# Development build (slow)
npm run dev

# Production build (fast)
npm run build
NODE_ENV=production node dist/example.js
```

### 2. Cache Dependencies

```bash
# Use npm ci for faster installs
npm ci  # Instead of npm install
```

### 3. Optimize RPC Calls

```typescript
// Bad: Multiple sequential calls
const bal1 = await provider.getBalance(addr1);
const bal2 = await provider.getBalance(addr2);
const bal3 = await provider.getBalance(addr3);

// Good: Parallel calls
const [bal1, bal2, bal3] = await Promise.all([
  provider.getBalance(addr1),
  provider.getBalance(addr2),
  provider.getBalance(addr3)
]);
```

### 4. Use Layer 2 Networks

```typescript
// Slow + Expensive: Ethereum mainnet
const provider = new TestnetProvider(TestnetNetwork.SEPOLIA);

// Fast + Cheap: Layer 2
const provider = new TestnetProvider(TestnetNetwork.BASE_SEPOLIA);
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Wallet Library

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd lib/wallet && npm ci
      - run: cd lib/wallet && npm run build
      - run: cd lib/wallet && npm test
```

---

## Next Steps

Now that you have the environment set up:

1. **Learn the Basics** - Read [BLOCKCHAIN_101.md](./BLOCKCHAIN_101.md)
2. **Understand x402** - Read [X402_GUIDE.md](./X402_GUIDE.md)
3. **Explore Examples** - Run examples in `lib/wallet/examples/`
4. **Build Something** - Create your own agent with x402 payments!

---

## Quick Commands Reference

```bash
# Setup
git clone --recursive https://github.com/anthropics/Agentic_OS.git
cd Agentic_OS/lib/wallet
npm install

# Development
npm run dev          # Watch mode
npm run build        # Production build
npm test            # Run tests
npm run lint        # Check code style
npm run format      # Format code

# Run examples
node dist/example.js                    # Basic wallet
node dist/examples/x402/provider.js     # x402 provider
node dist/examples/x402/consumer.js     # x402 consumer

# Git workflow
git checkout -b feature/my-feature
git add .
git commit -m "feat: description"
git push origin feature/my-feature
```

---

**Ready to build?** Start with the [basic example](../lib/wallet/examples/basic.ts) and work your way up to [x402 integration](../lib/wallet/examples/x402/)!

**Questions?** Join our [Discord](https://discord.gg/browseros) 🚀
