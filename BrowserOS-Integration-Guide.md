# 🌐 BrowserOS Wallet Integration Guide

Complete guide to integrating the blockchain wallet and x402 payment system into BrowserOS.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Your Wallet Details](#your-wallet-details)
3. [Testing the Wallet](#testing-the-wallet)
4. [BrowserOS Integration](#browseros-integration)
5. [UI Components](#ui-components)
6. [x402 Agent Payments](#x402-agent-payments)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### ✅ What's Already Set Up

Your wallet library is **fully functional** and ready to use:

- ✅ Wallet created: `0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83`
- ✅ Connected to Base Sepolia (block: 33837491)
- ✅ API keys configured
- ✅ Examples working
- ⚠️ Needs testnet tokens (see below)

### 📁 Project Structure

```
Agentic_OS/
├── lib/wallet/                      # ← Wallet library (ready to use)
│   ├── dist/                        # Compiled JavaScript
│   ├── config/networks.ts           # Network configs (API key added)
│   ├── wallet-config.json           # Your wallet info
│   ├── setup-wallet.js              # Setup script
│   └── test-connection.js           # Connectivity tester
│
├── packages/
│   └── browseros/                   # ← BrowserOS browser
│       └── [integration goes here]
│
└── docs/wallet/                     # Documentation
    ├── LOCAL_SETUP.md
    ├── ARCHITECTURE.md
    └── X402_GUIDE.md
```

---

## 🔑 Your Wallet Details

**Wallet Address:**
```
0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83
```

**Network:** Base Sepolia (Testnet)

**View on Explorer:**
https://sepolia.basescan.org/address/0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83

**Mnemonic Phrase:**
```
humble wave picture total humor tip gesture excite license capable clog endorse
```
⚠️ **SAVE THIS SECURELY!** This is the only way to recover your wallet.

**Configuration File:**
`lib/wallet/wallet-config.json`

---

## 🧪 Testing the Wallet

### Step 1: Get Testnet Tokens

You need testnet ETH for gas fees:

**Option A: Coinbase Faucet (Recommended)**
1. Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet?address=0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83
2. Complete verification
3. Get 0.1 testnet ETH

**Option B: Alternative Faucets**
- QuickNode: https://faucet.quicknode.com/base/sepolia
- Alchemy: https://www.alchemy.com/faucets/base-sepolia

### Step 2: Verify Balance

```bash
cd lib/wallet
node -e "
const { WalletManager } = require('./dist/index');
const config = require('./wallet-config.json');

async function checkBalance() {
  const wm = new WalletManager();
  await wm.getProvider().connect('base-sepolia');
  const balance = await wm.getBalance(config.address);
  console.log('Balance:', (parseFloat(balance) / 1e18), 'ETH');
}
checkBalance();
"
```

### Step 3: Test x402 Provider Agent

```bash
cd lib/wallet
node dist/examples/x402/provider.js
```

Expected output:
```
✅ Provider wallet created
✅ Connected to Base Sepolia
✅ Service registered with pricing
✅ Monitoring for incoming payments
```

### Step 4: Test x402 Consumer Agent

Open a second terminal:
```bash
cd lib/wallet
node dist/examples/x402/consumer.js
```

---

## 🔌 BrowserOS Integration

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│         BrowserOS Application               │
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   Browser    │      │   Extension     │ │
│  │   Frontend   │◄────►│   Background    │ │
│  │              │      │   Service       │ │
│  └──────────────┘      └─────────────────┘ │
│         │                      │            │
│         │                      │            │
│         └──────────┬───────────┘            │
│                    │                        │
│            ┌───────▼────────┐               │
│            │ Wallet Manager │               │
│            │  - WalletMgr   │               │
│            │  - X402Mgr     │               │
│            │  - TokenMgr    │               │
│            └───────┬────────┘               │
└────────────────────┼──────────────────────────┘
                     │
              ┌──────▼────────┐
              │ Base Sepolia  │
              │  Blockchain   │
              └───────────────┘
```

### Integration Steps

#### 1. Import Wallet Library

**In your BrowserOS extension:**

```typescript
// Import the wallet library
import { WalletManager, X402Manager, TestnetNetwork } from '@browseros/wallet';

// Initialize
const walletManager = new WalletManager({ debug: false });
const x402Manager = new X402Manager(walletManager);
```

#### 2. Create Background Service

**File: `packages/browseros-agent/src/background/wallet-service.ts`**

```typescript
import { WalletManager, X402Manager, TestnetNetwork } from '@browseros/wallet';

class WalletService {
  private walletManager: WalletManager;
  private x402Manager: X402Manager;
  private currentWallet: any;

  constructor() {
    this.walletManager = new WalletManager();
    this.x402Manager = new X402Manager(this.walletManager);
  }

  async initialize() {
    // Connect to Base Sepolia
    await this.walletManager.getProvider().connect(TestnetNetwork.BASE_SEPOLIA);

    // Load existing wallet or create new one
    const savedWallet = await chrome.storage.local.get('wallet');
    if (savedWallet.wallet) {
      this.currentWallet = await this.walletManager.importWallet(
        savedWallet.wallet.mnemonic,
        savedWallet.wallet.password
      );
    }
  }

  async createWallet(password: string) {
    const wallet = await this.walletManager.createWallet(password);

    // Save to Chrome storage
    await chrome.storage.local.set({
      wallet: {
        address: wallet.address,
        mnemonic: wallet.mnemonic,
        password: password, // In production, handle more securely
      }
    });

    this.currentWallet = wallet;
    return wallet;
  }

  async getBalance() {
    if (!this.currentWallet) throw new Error('No wallet loaded');
    return await this.walletManager.getBalance(this.currentWallet.address);
  }

  async makePayment(provider: string, amount: string, invoiceId: string) {
    if (!this.currentWallet) throw new Error('No wallet loaded');

    return await this.x402Manager.makePayment(
      {
        provider,
        endpoint: '',
        amount,
        currency: 'USDC',
        network: TestnetNetwork.BASE_SEPOLIA,
        invoiceId,
      },
      this.currentWallet.address
    );
  }
}

// Expose to browser
const walletService = new WalletService();
walletService.initialize();
```

#### 3. Add Message Handler

```typescript
// Listen for messages from frontend
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'GET_BALANCE':
      walletService.getBalance().then(sendResponse);
      return true;

    case 'MAKE_PAYMENT':
      walletService.makePayment(
        request.provider,
        request.amount,
        request.invoiceId
      ).then(sendResponse);
      return true;

    case 'GET_WALLET_ADDRESS':
      sendResponse({ address: walletService.currentWallet?.address });
      return true;
  }
});
```

---

## 🎨 UI Components

### Wallet Panel Component

Create a React component for the wallet UI:

**File: `packages/browseros-agent/src/sidepanel/components/WalletPanel.tsx`**

```tsx
import React, { useState, useEffect } from 'react';

interface WalletInfo {
  address: string;
  balance: string;
  network: string;
}

export const WalletPanel: React.FC = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletInfo();
  }, []);

  const loadWalletInfo = async () => {
    try {
      // Get wallet address
      const addressResponse = await chrome.runtime.sendMessage({
        type: 'GET_WALLET_ADDRESS'
      });

      // Get balance
      const balanceResponse = await chrome.runtime.sendMessage({
        type: 'GET_BALANCE'
      });

      setWallet({
        address: addressResponse.address,
        balance: (parseFloat(balanceResponse) / 1e18).toFixed(4),
        network: 'Base Sepolia'
      });
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading wallet...</div>;
  }

  if (!wallet) {
    return <div>No wallet found</div>;
  }

  return (
    <div className="wallet-panel">
      <h2>🔐 Wallet</h2>

      <div className="wallet-info">
        <div className="wallet-address">
          <label>Address:</label>
          <code>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</code>
        </div>

        <div className="wallet-balance">
          <label>Balance:</label>
          <strong>{wallet.balance} ETH</strong>
        </div>

        <div className="wallet-network">
          <label>Network:</label>
          <span>🟦 {wallet.network}</span>
        </div>
      </div>

      <div className="wallet-actions">
        <button onClick={() => window.open(`https://sepolia.basescan.org/address/${wallet.address}`)}>
          View on Explorer
        </button>
        <button onClick={() => window.open('https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet')}>
          Get Testnet Tokens
        </button>
      </div>
    </div>
  );
};
```

### Styling

```css
.wallet-panel {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.wallet-info {
  margin: 15px 0;
  padding: 15px;
  background: white;
  border-radius: 6px;
}

.wallet-address, .wallet-balance, .wallet-network {
  margin: 10px 0;
}

.wallet-address code {
  background: #eee;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.wallet-actions {
  display: flex;
  gap: 10px;
}

.wallet-actions button {
  flex: 1;
  padding: 10px;
  background: #0052ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.wallet-actions button:hover {
  background: #0041cc;
}
```

---

## 💸 x402 Agent Payments

### Enable Automatic Payments

**Scenario:** Your AI agent needs to use a paid service

```typescript
// In your agent code
import { X402Manager } from '@browseros/wallet';

class MyAIAgent {
  private x402: X402Manager;

  constructor(walletManager: WalletManager) {
    this.x402 = new X402Manager(walletManager);
  }

  async analyzeImage(imageUrl: string) {
    // Agent discovers an image analysis service
    const serviceProvider = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const serviceEndpoint = 'https://image-agent.com/analyze';

    // Make payment automatically
    const payment = await this.x402.makePayment(
      {
        provider: serviceProvider,
        endpoint: serviceEndpoint,
        amount: '0.001',  // $0.001
        currency: 'USDC',
        network: TestnetNetwork.BASE_SEPOLIA,
        invoiceId: `inv_${Date.now()}`,
      },
      this.walletAddress
    );

    if (payment.success) {
      console.log('✅ Payment successful:', payment.txHash);
      // Now make the API request with payment proof
      const result = await fetch(serviceEndpoint, {
        method: 'POST',
        headers: {
          'X-402-Payment-Proof': payment.txHash,
        },
        body: JSON.stringify({ image: imageUrl }),
      });

      return await result.json();
    } else {
      console.error('❌ Payment failed:', payment.error);
    }
  }
}
```

### Offer Services (Earn Money)

**Scenario:** Your agent provides a service and charges for it

```typescript
import { X402Manager } from '@browseros/wallet';
import express from 'express';

const app = express();
const walletManager = new WalletManager();
const x402 = new X402Manager(walletManager);

// Register your service
x402.registerService({
  endpoint: '/api/analyze',
  pricing: {
    '/api/analyze': '0.001',  // $0.001 per request
  },
  currency: 'USDC',
  network: TestnetNetwork.BASE_SEPOLIA,
});

// Handle requests
app.post('/api/analyze', async (req, res) => {
  const paymentProof = req.headers['x-402-payment-proof'];

  if (!paymentProof) {
    // Return 402 Payment Required
    const paymentRequest = await x402.generatePaymentRequest({
      amount: '0.001',
      currency: 'USDC',
    });

    return res.status(402).json(paymentRequest);
  }

  // Verify payment
  const isValid = await x402.verifyPayment(paymentProof);
  if (!isValid) {
    return res.status(403).json({ error: 'Invalid payment' });
  }

  // Provide service
  const result = await analyzeImage(req.body.image);
  res.json({ result });
});

app.listen(3000);
```

---

## 🔧 Build & Deploy

### 1. Build the Wallet Library

```bash
cd lib/wallet
npm run build
```

### 2. Link to BrowserOS

**Option A: npm link**
```bash
cd lib/wallet
npm link

cd ../../packages/browseros-agent
npm link @browseros/wallet
```

**Option B: Direct import**
```typescript
// In browseros-agent package.json
{
  "dependencies": {
    "@browseros/wallet": "file:../../lib/wallet"
  }
}
```

### 3. Build BrowserOS Extension

```bash
cd packages/browseros-agent
npm install
npm run build
```

### 4. Load in Browser

1. Open Chrome/BrowserOS
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `packages/browseros-agent/dist`

---

## ✅ Testing Checklist

### Basic Wallet Functions

- [ ] Create wallet
- [ ] View wallet address in UI
- [ ] Check balance
- [ ] View on block explorer
- [ ] Get testnet tokens from faucet

### x402 Payments

- [ ] Start provider agent (service that earns)
- [ ] Start consumer agent (service that pays)
- [ ] Make automatic payment
- [ ] Verify payment on blockchain
- [ ] Receive service after payment

### BrowserOS Integration

- [ ] Wallet panel appears in UI
- [ ] Balance updates automatically
- [ ] Can make payments from browser
- [ ] Agents can use wallet service
- [ ] Payment history visible

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@browseros/wallet'"

**Solution:**
```bash
cd lib/wallet
npm link

cd ../../packages/browseros-agent
npm link @browseros/wallet
npm install
```

### Issue: "Network connection failed"

**Solution:**
Check that Base Sepolia RPC is accessible:
```bash
cd lib/wallet
node test-connection.js
```

### Issue: "Insufficient funds"

**Solution:**
Get testnet tokens:
https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet?address=0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83

### Issue: "Payment verification failed"

**Solution:**
1. Wait for transaction confirmation (2-3 blocks)
2. Check transaction on explorer
3. Ensure correct network (Base Sepolia)

---

## 📊 Monitoring & Analytics

### View Transaction History

```typescript
const history = await walletManager.getTransactionHistory(wallet.address);
console.log('Recent transactions:', history);
```

### Track Earnings (Provider)

```typescript
x402.on('paymentReceived', (payment) => {
  console.log(`💰 Earned ${payment.amount} USDC from ${payment.from}`);
  // Save to database, update UI, etc.
});
```

### Track Spending (Consumer)

```typescript
x402.on('paymentSent', (payment) => {
  console.log(`💸 Spent ${payment.amount} USDC to ${payment.to}`);
  // Update budget tracking
});
```

---

## 🎯 Next Steps

1. **Get Testnet Tokens:**
   Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet?address=0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83

2. **Test Complete Flow:**
   ```bash
   # Terminal 1: Start provider
   cd lib/wallet
   node dist/examples/x402/provider.js

   # Terminal 2: Start consumer
   node dist/examples/x402/consumer.js
   ```

3. **Integrate UI:**
   - Add WalletPanel component to BrowserOS
   - Show balance and address
   - Enable payments from browser

4. **Deploy Your First Agent:**
   - Create an agent that offers a service
   - Set pricing with x402
   - Earn automatic payments!

---

## 📚 Additional Resources

- **Documentation:** `docs/wallet/`
- **Examples:** `lib/wallet/examples/x402/`
- **Configuration:** `lib/wallet/wallet-config.json`
- **Network Config:** `lib/wallet/config/networks.ts`

---

**Questions?** Check the wallet documentation or open an issue! 🚀
