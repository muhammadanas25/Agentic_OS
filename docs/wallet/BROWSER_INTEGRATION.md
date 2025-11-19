# BrowserOS Wallet Integration Guide

This guide explains how to integrate the wallet library into BrowserOS browser and implement the x402 payment protocol for AI agents.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Launch Options](#launch-options)
3. [Integration Steps](#integration-steps)
4. [Wallet UI Implementation](#wallet-ui-implementation)
5. [x402 Payment Flow](#x402-payment-flow)

---

## Architecture Overview

### BrowserOS Structure

```
Agentic_OS/
├── lib/wallet/              # Your wallet library (completed ✓)
│   ├── WalletManager.ts     # Core wallet operations
│   ├── X402Manager.ts       # Payment protocol
│   ├── TokenManager.ts      # USDC/ERC-20 support
│   └── WalletStorage.ts     # Multi-environment storage
│
└── packages/browseros/      # Browser application
    ├── build/               # Build scripts (Python)
    ├── chromium_patches/    # Browser customizations
    └── resources/files/     # Browser extensions/UI
        └── ai_side_panel/   # AI panel (integration point)
            ├── sidepanel.html
            ├── sidepanel.js
            ├── background.js
            └── content.js
```

### Technology Stack

- **Browser**: Chromium-based (C++/Python build system)
- **Extensions**: Chrome Extension API (JavaScript)
- **Side Panel**: JavaScript + HTML/CSS
- **Wallet Library**: TypeScript (browser-compatible)

---

## Launch Options

### Option 1: Download Pre-Built Binary (Easiest)

Download and run BrowserOS directly:

**macOS**:
```bash
curl -L https://files.browseros.com/download/BrowserOS.dmg -o BrowserOS.dmg
open BrowserOS.dmg
```

**Linux**:
```bash
curl -L https://files.browseros.com/download/BrowserOS.AppImage -o BrowserOS.AppImage
chmod +x BrowserOS.AppImage
./BrowserOS.AppImage
```

**Windows**:
```bash
# Download from: https://files.browseros.com/download/BrowserOS_installer.exe
# Run the installer
```

### Option 2: Build from Source (For Development)

This requires setting up Chromium build environment:

```bash
cd packages/browseros

# Prerequisites (varies by OS)
# - Python 3.x
# - Chromium source code (large download ~30GB)
# - Build tools (ninja, clang, etc.)

# Follow Chromium build instructions:
# https://chromium.googlesource.com/chromium/src/+/main/docs/linux/build_instructions.md

# Once Chromium is set up:
python3 build/build.py --help
```

**Note**: Building Chromium from scratch takes hours and requires significant disk space (50-100GB) and RAM (16GB+).

### Option 3: Develop Extensions Only (Recommended for Wallet Integration)

You can develop and test browser extensions without building the entire browser:

```bash
# Use pre-built BrowserOS + develop extensions
# 1. Download BrowserOS binary
# 2. Load unpacked extension from packages/browseros/resources/files/ai_side_panel
# 3. Make changes and reload
```

---

## Integration Steps

### Step 1: Link Wallet Library to Browser

Create a bundled version of the wallet library for browser use:

```bash
cd lib/wallet

# Install browserify or webpack
npm install --save-dev browserify @types/node

# Add build script to package.json
npm run build:browser
```

Add this script to `lib/wallet/package.json`:

```json
{
  "scripts": {
    "build:browser": "browserify dist/index.js -o ../browseros-wallet.bundle.js -s BrowserOSWallet"
  }
}
```

### Step 2: Copy Wallet Bundle to Browser Resources

```bash
# After building the browser bundle
cp lib/browseros-wallet.bundle.js packages/browseros/resources/files/ai_side_panel/wallet.js
```

### Step 3: Update Side Panel HTML

Edit `packages/browseros/resources/files/ai_side_panel/sidepanel.html`:

```html
<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>BrowserOS Side Panel</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">

  <!-- Add wallet library -->
  <script src="wallet.js"></script>
</head>
<body>
  <div id="root"></div>

  <!-- Side panel scripts -->
  <script src="sidepanel.js"></script>
</body>
</html>
```

### Step 4: Initialize Wallet in Background Script

Edit `packages/browseros/resources/files/ai_side_panel/background.js`:

```javascript
// Add at the top
let walletManager = null;
let x402Manager = null;

// Initialize wallet on extension load
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[BrowserOS Wallet] Initializing...');

  try {
    // The wallet bundle exposes BrowserOSWallet globally
    const { WalletManager, X402Manager } = window.BrowserOSWallet;

    // Initialize managers
    walletManager = new WalletManager({
      debug: true,
      storageKey: 'browseros_wallet'
    });

    x402Manager = new X402Manager(walletManager);

    console.log('[BrowserOS Wallet] Ready');
  } catch (error) {
    console.error('[BrowserOS Wallet] Initialization failed:', error);
  }
});

// Add message handler for wallet operations
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WALLET_OPERATION') {
    handleWalletOperation(message, sendResponse);
    return true; // Keep channel open for async response
  }
});

async function handleWalletOperation(message, sendResponse) {
  const { operation, params } = message;

  try {
    let result;

    switch (operation) {
      case 'CREATE_WALLET':
        result = await walletManager.createWallet(params.password);
        break;

      case 'GET_BALANCE':
        result = await walletManager.getBalance(params.address, params.network);
        break;

      case 'MAKE_PAYMENT':
        result = await x402Manager.makePayment(params.request, params.fromAddress);
        break;

      case 'MONITOR_PAYMENTS':
        result = await x402Manager.monitorPayments(params.address, params.network);
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    sendResponse({ success: true, data: result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}
```

---

## Wallet UI Implementation

### Create Wallet Panel Component

Create `packages/browseros/resources/files/ai_side_panel/wallet-panel.html`:

```html
<div id="wallet-panel" class="wallet-panel">
  <div class="wallet-header">
    <h2>BrowserOS Wallet</h2>
    <button id="wallet-settings-btn" class="icon-btn">⚙️</button>
  </div>

  <div id="wallet-content">
    <!-- Wallet not created -->
    <div id="wallet-setup" class="wallet-section">
      <h3>Create Your Wallet</h3>
      <p>Set up a wallet to enable x402 payments for AI agents</p>
      <input type="password" id="wallet-password" placeholder="Enter password" />
      <button id="create-wallet-btn" class="primary-btn">Create Wallet</button>
    </div>

    <!-- Wallet created -->
    <div id="wallet-dashboard" class="wallet-section" style="display:none;">
      <div class="wallet-balance">
        <div class="balance-label">Balance</div>
        <div id="eth-balance" class="balance-amount">0 ETH</div>
        <div id="usdc-balance" class="balance-amount">0 USDC</div>
      </div>

      <div class="wallet-address">
        <label>Your Address:</label>
        <div id="wallet-address-text" class="address-text"></div>
        <button id="copy-address-btn" class="icon-btn">📋</button>
      </div>

      <div class="wallet-actions">
        <button id="receive-btn" class="action-btn">Receive</button>
        <button id="send-btn" class="action-btn">Send</button>
        <button id="faucet-btn" class="action-btn">Faucet</button>
      </div>

      <div class="payment-history">
        <h4>Recent Payments</h4>
        <div id="payment-list" class="payment-list"></div>
      </div>
    </div>
  </div>
</div>
```

### Add Wallet Panel Styles

Create `packages/browseros/resources/files/ai_side_panel/wallet-panel.css`:

```css
.wallet-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1b;
  color: #fff;
  font-family: 'Inter', sans-serif;
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #2d2d2e;
}

.wallet-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.wallet-section {
  padding: 20px;
}

.wallet-balance {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.balance-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.wallet-address {
  background: #2d2d2e;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.address-text {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wallet-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.action-btn {
  padding: 12px;
  background: #2d2d2e;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #3d3d3e;
  transform: translateY(-2px);
}

.primary-btn {
  width: 100%;
  padding: 12px;
  background: #667eea;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 12px;
}

.primary-btn:hover {
  background: #5568d3;
}

.payment-list {
  max-height: 300px;
  overflow-y: auto;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #2d2d2e;
  border-radius: 8px;
  margin-bottom: 8px;
}

.payment-item.received {
  border-left: 3px solid #10b981;
}

.payment-item.sent {
  border-left: 3px solid #ef4444;
}
```

### Initialize Wallet UI

Create `packages/browseros/resources/files/ai_side_panel/wallet-ui.js`:

```javascript
/**
 * Wallet UI Controller
 * Handles all wallet-related UI interactions
 */

class WalletUI {
  constructor() {
    this.wallet = null;
    this.init();
  }

  async init() {
    // Load wallet state
    await this.loadWalletState();

    // Set up event listeners
    this.setupEventListeners();

    // Start monitoring if wallet exists
    if (this.wallet) {
      await this.startMonitoring();
    }
  }

  async loadWalletState() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'WALLET_OPERATION',
        operation: 'GET_WALLETS'
      });

      if (response.success && response.data.length > 0) {
        this.wallet = response.data[0];
        this.showDashboard();
        await this.updateBalances();
      } else {
        this.showSetup();
      }
    } catch (error) {
      console.error('[Wallet UI] Failed to load state:', error);
      this.showSetup();
    }
  }

  setupEventListeners() {
    // Create wallet
    document.getElementById('create-wallet-btn')?.addEventListener('click', async () => {
      const password = document.getElementById('wallet-password').value;
      if (!password) {
        alert('Please enter a password');
        return;
      }

      await this.createWallet(password);
    });

    // Copy address
    document.getElementById('copy-address-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.wallet.address);
      alert('Address copied!');
    });

    // Faucet button
    document.getElementById('faucet-btn')?.addEventListener('click', async () => {
      await this.requestFaucet();
    });
  }

  async createWallet(password) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'WALLET_OPERATION',
        operation: 'CREATE_WALLET',
        params: { password }
      });

      if (response.success) {
        this.wallet = response.data;
        this.showDashboard();
        await this.updateBalances();
      } else {
        alert('Failed to create wallet: ' + response.error);
      }
    } catch (error) {
      alert('Error creating wallet: ' + error.message);
    }
  }

  async updateBalances() {
    if (!this.wallet) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'WALLET_OPERATION',
        operation: 'GET_BALANCE',
        params: {
          address: this.wallet.address,
          network: 'base-sepolia'
        }
      });

      if (response.success) {
        document.getElementById('eth-balance').textContent =
          `${response.data.eth} ETH`;
        document.getElementById('usdc-balance').textContent =
          `${response.data.usdc} USDC`;
      }
    } catch (error) {
      console.error('[Wallet UI] Failed to update balances:', error);
    }
  }

  async requestFaucet() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'WALLET_OPERATION',
        operation: 'REQUEST_FAUCET',
        params: {
          address: this.wallet.address,
          network: 'base-sepolia'
        }
      });

      if (response.success) {
        alert('Faucet request sent! Tokens should arrive in a few minutes.');
        setTimeout(() => this.updateBalances(), 5000);
      }
    } catch (error) {
      alert('Faucet request failed: ' + error.message);
    }
  }

  async startMonitoring() {
    // Start payment monitoring
    await chrome.runtime.sendMessage({
      type: 'WALLET_OPERATION',
      operation: 'MONITOR_PAYMENTS',
      params: {
        address: this.wallet.address,
        network: 'base-sepolia'
      }
    });

    // Listen for payment events
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'PAYMENT_DETECTED') {
        this.handlePaymentDetected(message.data);
      }
    });
  }

  handlePaymentDetected(payment) {
    // Add to payment list
    const paymentList = document.getElementById('payment-list');
    const item = document.createElement('div');
    item.className = `payment-item ${payment.type}`;
    item.innerHTML = `
      <div>
        <div class="payment-amount">${payment.amount} USDC</div>
        <div class="payment-from">${payment.from.substring(0, 10)}...</div>
      </div>
      <div class="payment-status">✓</div>
    `;
    paymentList.prepend(item);

    // Update balances
    this.updateBalances();

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Payment Received',
      message: `Received ${payment.amount} USDC`
    });
  }

  showSetup() {
    document.getElementById('wallet-setup').style.display = 'block';
    document.getElementById('wallet-dashboard').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('wallet-setup').style.display = 'none';
    document.getElementById('wallet-dashboard').style.display = 'block';

    // Display wallet address
    document.getElementById('wallet-address-text').textContent = this.wallet.address;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new WalletUI();
});
```

---

## x402 Payment Flow

### Automatic Payment Detection

When AI agent makes HTTP requests, the browser can detect 402 responses and handle payments automatically:

```javascript
// In background.js - intercept HTTP requests
chrome.webRequest.onHeadersReceived.addListener(
  async (details) => {
    // Check for 402 Payment Required
    const header402 = details.responseHeaders.find(
      h => h.name.toLowerCase() === 'x-402-required'
    );

    if (header402) {
      // Extract payment details from headers
      const paymentHeaders = details.responseHeaders.reduce((acc, h) => {
        if (h.name.startsWith('X-402-')) {
          acc[h.name] = h.value;
        }
        return acc;
      }, {});

      // Show payment prompt to user
      const approved = await showPaymentPrompt(paymentHeaders);

      if (approved) {
        // Make payment
        const payment = await x402Manager.makePayment({
          provider: paymentHeaders['X-402-Address'],
          endpoint: details.url,
          amount: paymentHeaders['X-402-Amount'],
          currency: paymentHeaders['X-402-Currency'],
          network: paymentHeaders['X-402-Network'],
          invoiceId: paymentHeaders['X-402-Invoice-ID']
        }, walletManager.defaultWallet.address);

        if (payment.success) {
          // Retry request with payment proof
          chrome.tabs.update(details.tabId, {
            url: details.url,
            headers: {
              'X-Payment-Proof': payment.proof.txHash
            }
          });
        }
      }
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders', 'blocking']
);
```

---

## Next Steps

1. **Build Wallet Bundle**: Create browser-compatible bundle of wallet library
2. **Copy to Browser**: Add wallet.js to side panel resources
3. **Update Manifest**: Add required permissions to `manifest.json`
4. **Test in Browser**: Load unpacked extension and test wallet creation
5. **Connect to Testnet**: Configure RPC endpoints for Base Sepolia
6. **Test Payments**: Use x402 examples to test end-to-end flow

## Required Permissions

Add to `manifest.json`:

```json
{
  "permissions": [
    "storage",
    "notifications",
    "webRequest",
    "webRequestBlocking"
  ],
  "host_permissions": [
    "https://*.base-sepolia.blockpi.network/*",
    "https://*.alchemy.com/*",
    "https://*.infura.io/*"
  ]
}
```

---

## Troubleshooting

### Common Issues

**Wallet not initializing**:
- Check browser console for errors
- Verify wallet.js is loaded correctly
- Check storage permissions

**Network connection failed**:
- Configure RPC endpoints in settings
- Add API keys if required
- Check firewall/proxy settings

**Payments not working**:
- Ensure wallet has testnet ETH for gas
- Verify USDC balance is sufficient
- Check network is connected

---

## Support

For issues or questions:
- Check logs in browser DevTools console
- Review wallet library docs: `docs/wallet/README.md`
- Review x402 guide: `docs/wallet/X402_GUIDE.md`
- Join Discord: https://discord.gg/YKwjt5vuKr
