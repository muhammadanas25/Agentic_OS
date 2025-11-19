# 🚀 BrowserOS Wallet - Quick Start Checklist

Everything you need to test and verify the wallet integration with BrowserOS.

---

## ✅ Pre-Integration Checklist (Do These First)

### 1. Verify Wallet Setup ✅ DONE

Your wallet is ready:
- **Address:** `0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83`
- **Network:** Base Sepolia (Connected ✅)
- **Config:** `lib/wallet/wallet-config.json`

### 2. Get Testnet Tokens 🔴 TODO

**Critical:** You need testnet ETH for gas fees.

**Action Required:**
```
Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet?address=0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83

Steps:
1. Click the link above
2. Complete Coinbase verification
3. Request 0.1 testnet ETH
4. Wait 2-3 minutes for confirmation
```

**Verify you got tokens:**
```bash
cd lib/wallet
node -e "
const { WalletManager, TestnetNetwork } = require('./dist/index');
const config = require('./wallet-config.json');

async function check() {
  const wm = new WalletManager();
  await wm.getProvider().connect(TestnetNetwork.BASE_SEPOLIA);
  const bal = await wm.getBalance(config.address);
  console.log('Balance:', (parseFloat(bal) / 1e18).toFixed(4), 'ETH');
  if (parseFloat(bal) > 0) {
    console.log('✅ Wallet funded! Ready to test.');
  } else {
    console.log('❌ Still waiting for tokens...');
  }
}
check();
"
```

### 3. Test Wallet Functions

**Test basic connectivity:**
```bash
cd lib/wallet
node test-connection.js
```

Expected output:
```
✅ Base Sepolia connected
Latest block: [number]
```

### 4. Test x402 Examples

**Terminal 1 - Start Provider Agent:**
```bash
cd lib/wallet
node dist/examples/x402/provider.js
```

You should see:
```
✅ Provider wallet created
✅ Connected to Base Sepolia
✅ Service registered with pricing
✅ Monitoring for incoming payments
```

**Terminal 2 - Start Consumer Agent:**
```bash
cd lib/wallet
node dist/examples/x402/consumer.js
```

You should see:
```
✅ Consumer wallet created
✅ Connected to Base Sepolia
✅ x402 client ready
💸 Payment sent (or error if no USDC)
```

---

## 🔌 BrowserOS Integration Steps

### Step 1: Locate BrowserOS Extension Code

```bash
# Find your BrowserOS extension
ls -la packages/browseros-agent/

# Expected structure:
# src/
#   ├── background/      ← Add wallet service here
#   ├── sidepanel/       ← Add wallet UI here
#   └── lib/             ← Import wallet library
```

### Step 2: Link Wallet Library

```bash
# From project root
cd lib/wallet
npm link

# Go to BrowserOS extension
cd ../../packages/browseros-agent
npm link @browseros/wallet
npm install
```

### Step 3: Add Wallet Service

Create: `packages/browseros-agent/src/background/wallet-service.ts`

```typescript
import { WalletManager, X402Manager, TestnetNetwork } from '@browseros/wallet';

export class WalletService {
  private walletManager: WalletManager;
  private x402Manager: X402Manager;

  constructor() {
    this.walletManager = new WalletManager({ debug: false });
    this.x402Manager = new X402Manager(this.walletManager);
  }

  async initialize() {
    await this.walletManager
      .getProvider()
      .connect(TestnetNetwork.BASE_SEPOLIA);
  }

  async getBalance(address: string) {
    return await this.walletManager.getBalance(address);
  }
}

// Initialize on extension load
const walletService = new WalletService();
walletService.initialize();
```

### Step 4: Add UI Component

Create: `packages/browseros-agent/src/sidepanel/components/WalletPanel.tsx`

```tsx
import React, { useState, useEffect } from 'react';

export const WalletPanel = () => {
  const [balance, setBalance] = useState('0');
  const [address] = useState('0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83');

  useEffect(() => {
    // Load balance from wallet service
    loadBalance();
  }, []);

  const loadBalance = async () => {
    // Call your wallet service
    const bal = await getBalanceFromService();
    setBalance(bal);
  };

  return (
    <div className="wallet-panel">
      <h3>🔐 Wallet</h3>
      <p>Address: {address.slice(0, 6)}...{address.slice(-4)}</p>
      <p>Balance: {balance} ETH</p>
      <button onClick={() => window.open(`https://sepolia.basescan.org/address/${address}`)}>
        View Explorer
      </button>
    </div>
  );
};
```

### Step 5: Build BrowserOS Extension

```bash
cd packages/browseros-agent
npm run build

# Or for development with hot reload:
npm run dev
```

### Step 6: Load in Browser

1. Open Chrome (or BrowserOS browser)
2. Navigate to: `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select: `packages/browseros-agent/dist`

---

## 🧪 Testing with BrowserOS

### Test 1: Wallet Display

**Check that:**
- [ ] Wallet panel appears in BrowserOS UI
- [ ] Shows correct address: `0xb4C5...4B83`
- [ ] Displays current balance
- [ ] "View Explorer" button works

### Test 2: Agent Payments

**Scenario:** Agent makes automatic payment

```typescript
// In your BrowserOS agent code
import { X402Manager } from '@browseros/wallet';

// Agent needs a service
const result = await x402Manager.makePayment({
  provider: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  amount: '0.001',
  currency: 'USDC',
  network: 'base-sepolia',
  invoiceId: 'inv_test_123'
});

console.log('Payment result:', result);
```

**Verify:**
- [ ] Payment transaction created
- [ ] Transaction hash returned
- [ ] Can view on block explorer
- [ ] Agent receives service response

### Test 3: Multiple Agents

**Run provider and consumer agents simultaneously:**

```bash
# Terminal 1
cd lib/wallet
node dist/examples/x402/provider.js

# Terminal 2
node dist/examples/x402/consumer.js
```

**Verify:**
- [ ] Provider listens for payments
- [ ] Consumer makes payment
- [ ] Payment detected by provider
- [ ] Service delivered

---

## 🔍 Verification Commands

### Check Wallet Balance

```bash
node -e "
const { WalletManager, TestnetNetwork } = require('./lib/wallet/dist/index');
const config = require('./lib/wallet/wallet-config.json');

async function check() {
  const wm = new WalletManager();
  await wm.getProvider().connect(TestnetNetwork.BASE_SEPOLIA);
  const bal = await wm.getBalance(config.address);
  console.log('Balance:', (parseFloat(bal) / 1e18).toFixed(4), 'ETH');
}
check();
"
```

### View Transaction History

```bash
node -e "
const { WalletManager, TestnetNetwork } = require('./lib/wallet/dist/index');
const config = require('./lib/wallet/wallet-config.json');

async function history() {
  const wm = new WalletManager();
  await wm.getProvider().connect(TestnetNetwork.BASE_SEPOLIA);
  const provider = wm.getProvider().getProvider();
  const txCount = await provider.getTransactionCount(config.address);
  console.log('Total transactions:', txCount);
}
history();
"
```

### Test Network Connection

```bash
cd lib/wallet
node test-connection.js
```

---

## 📊 Expected Results

### After Faucet Request:

```
Balance: 0.1000 ETH ✅
Status: Ready to make transactions
```

### After Running Provider Example:

```
✅ Provider wallet created: 0x030BB...
✅ Connected to Base Sepolia (block: 33782396)
✅ Service registered with pricing
✅ Monitoring for incoming payments
```

### After Running Consumer Example:

```
✅ Consumer wallet created: 0x0Dc35...
✅ Connected to Base Sepolia
✅ Testnet ETH requested
❌ Payment failed: Insufficient USDC balance (expected - need USDC faucet)
```

### After BrowserOS Integration:

```
BrowserOS UI:
  ┌─────────────────────────┐
  │ 🔐 Wallet               │
  │ Address: 0xb4C5...4B83  │
  │ Balance: 0.0950 ETH     │
  │ Network: Base Sepolia   │
  │ [View Explorer]         │
  └─────────────────────────┘
```

---

## ❗ Common Issues & Fixes

### Issue: "Module not found: @browseros/wallet"

**Fix:**
```bash
cd lib/wallet && npm link
cd ../../packages/browseros-agent && npm link @browseros/wallet
npm install
```

### Issue: "Balance shows 0 ETH"

**Fix:**
1. Get tokens from faucet (link in Step 2)
2. Wait 2-3 minutes
3. Refresh balance

### Issue: "Network connection failed"

**Fix:**
```bash
cd lib/wallet
node test-connection.js
```
Should show: ✅ Base Sepolia connected

### Issue: "Payment failed: Insufficient USDC"

**Expected:** Consumer example needs USDC (different from ETH)
**Solution:** For testnet USDC, you'll need a USDC faucet or bridge testnet ETH to USDC

---

## 🎯 Final Checklist

Before deploying to production:

- [ ] Wallet created and saved securely
- [ ] Network connectivity verified
- [ ] Testnet tokens acquired
- [ ] Basic examples tested
- [ ] x402 provider tested
- [ ] x402 consumer tested
- [ ] BrowserOS extension built
- [ ] Wallet UI added to BrowserOS
- [ ] Agent payments working
- [ ] Documentation reviewed

---

## 📚 Quick Reference

**Wallet Address:** `0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83`

**Get Tokens:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet?address=0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83

**Block Explorer:** https://sepolia.basescan.org/address/0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83

**Config File:** `lib/wallet/wallet-config.json`

**Integration Guide:** `BrowserOS-Integration-Guide.md`

**Examples:** `lib/wallet/dist/examples/x402/`

---

## 🚀 Next Steps

1. **Get testnet tokens** (Critical!)
2. **Test x402 examples** with funded wallet
3. **Integrate into BrowserOS** using the guide
4. **Test agent payments** end-to-end
5. **Deploy and iterate!**

---

**Ready to integrate?** Follow the steps above in order. Each step builds on the previous one.

**Need help?** Check `BrowserOS-Integration-Guide.md` for detailed code examples and troubleshooting.

Good luck! 🎉
