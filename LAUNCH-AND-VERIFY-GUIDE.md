# 🚀 BrowserOS Wallet - Launch & Verification Guide

Complete guide to launching BrowserOS with wallet integration and verifying from the UI.

---

## 🎯 Two Ways to Test Wallet UI

### **Option 1: Standalone Testing (5 minutes)** ⭐ **RECOMMENDED FOR QUICK TEST**

Test the wallet UI immediately in any browser without building BrowserOS.

### **Option 2: Chrome Extension (15 minutes)** ⭐ **RECOMMENDED FOR FULL TESTING**

Load as a Chrome extension to test wallet integration with real browser environment.

### **Option 3: Full BrowserOS Build (Complex)**

Build complete BrowserOS browser (requires Chromium source, ~100GB disk space).

---

## ⚡ Quick Start: Test Wallet UI Now!

### **Method 1: Open Standalone UI (Fastest)**

```bash
# Open wallet UI in your default browser
xdg-open packages/browseros-agent/wallet-ui-component.html

# Or on Mac:
open packages/browseros-agent/wallet-ui-component.html

# Or manually:
# Open packages/browseros-agent/wallet-ui-component.html in Chrome/Firefox
```

**What you'll see:**
```
┌─────────────────────────────────────────┐
│  🔐 BrowserOS Wallet                    │
│  Secure blockchain wallet for AI agents │
├─────────────────────────────────────────┤
│                                         │
│  🟦 Connected to Base Sepolia           │
│                                         │
│  💰 Balance: 0.0001 ETH                 │
│                                         │
│  📍 Address: 0xb4C5...4B83              │
│  🌐 Network: Base Sepolia               │
│  ⛽ Gas Fees: ~$0.001/tx                │
│                                         │
│  [🔍 View Explorer] [💧 Get Testnet ETH]│
│  [🔄 Refresh]      [📜 Transactions]    │
│                                         │
│  [💸 x402]  [🤖 AI]  [🛠️ Services]  [⚙️]  │
└─────────────────────────────────────────┘
```

**Verification Checklist:**
- [ ] Wallet loads without errors
- [ ] Shows your address: `0xb4C5...4B83`
- [ ] Shows balance: `0.0001 ETH`
- [ ] "View Explorer" button opens block explorer
- [ ] "Get Testnet ETH" button opens faucet
- [ ] Feature cards are clickable
- [ ] Address can be copied to clipboard

---

## 🔌 Method 2: Load as Chrome Extension

This gives you the full browser integration experience.

### **Step 1: Prepare Extension Directory**

```bash
# Create extension directory
mkdir -p packages/browseros-agent/extension

# Copy wallet files
cp packages/browseros-agent/wallet-ui-component.html packages/browseros-agent/extension/
cp wallet-integration-example.js packages/browseros-agent/extension/background.js
cp -r lib/wallet/dist packages/browseros-agent/extension/wallet
```

### **Step 2: Create manifest.json**

```bash
cat > packages/browseros-agent/extension/manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "BrowserOS Wallet",
  "version": "1.0.0",
  "description": "Blockchain wallet for AI agents with x402 payment protocol",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://*.basescan.org/*",
    "https://*.base.org/*",
    "https://www.coinbase.com/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_popup": "wallet-ui-component.html",
    "default_icon": {
      "16": "icon.png",
      "48": "icon.png",
      "128": "icon.png"
    },
    "default_title": "BrowserOS Wallet"
  },
  "icons": {
    "16": "icon.png",
    "48": "icon.png",
    "128": "icon.png"
  }
}
EOF
```

### **Step 3: Create Simple Icon**

```bash
# Create a simple icon (you can replace with a better one later)
cat > packages/browseros-agent/extension/icon.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#0052ff" rx="24"/>
  <text x="50%" y="50%" font-size="64" fill="white" text-anchor="middle" dy=".3em">🔐</text>
</svg>
EOF

# Convert to PNG (if you have imagemagick)
convert packages/browseros-agent/extension/icon.svg packages/browseros-agent/extension/icon.png 2>/dev/null || echo "⚠️  Install imagemagick to generate icon, or add icon.png manually"
```

### **Step 4: Load Extension in Chrome**

1. **Open Chrome Extensions:**
   ```
   chrome://extensions/
   ```
   Or click: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode:**
   - Toggle "Developer mode" switch in top-right corner

3. **Load Extension:**
   - Click "Load unpacked"
   - Navigate to: `packages/browseros-agent/extension/`
   - Click "Select Folder"

4. **Verify Extension Loaded:**
   - Should see "BrowserOS Wallet" in extensions list
   - Click the extension icon in toolbar (puzzle piece icon)
   - Pin the extension for easy access

### **Step 5: Open Wallet UI**

Click the BrowserOS Wallet icon in your Chrome toolbar.

**You should see:**
- Full wallet interface
- Current balance
- Your wallet address
- All action buttons working

---

## 🧪 Verification Tests

### **Test 1: Basic UI Functionality**

**Open the wallet and verify:**

```bash
# Run this first to make sure wallet is working
node verify-integration.js
```

Then open UI and check:

- [ ] ✅ Wallet panel loads
- [ ] ✅ Balance shows correctly (0.0001 ETH)
- [ ] ✅ Address displays (0xb4C5...4B83)
- [ ] ✅ Network badge shows "Base Sepolia"
- [ ] ✅ Status indicator is pulsing (connected)

**Test buttons:**

- [ ] ✅ Click "View Explorer" → Opens block explorer
- [ ] ✅ Click "Get Testnet ETH" → Opens faucet page
- [ ] ✅ Click "Refresh Balance" → Balance updates
- [ ] ✅ Click address → Copies to clipboard
- [ ] ✅ Notification shows "Address copied"

**Test feature cards:**

- [ ] ✅ Click "x402 Payments" → Shows info
- [ ] ✅ Click "AI Agents" → Shows info
- [ ] ✅ Click "Services" → Shows info
- [ ] ✅ Click "Settings" → Shows info

### **Test 2: Integration with Background Service**

Open Chrome DevTools console (F12) and check:

```javascript
// In console, verify wallet service
chrome.runtime.sendMessage({type: 'GET_WALLET_ADDRESS'}, response => {
  console.log('Wallet Address:', response);
});

chrome.runtime.sendMessage({type: 'GET_BALANCE'}, response => {
  console.log('Balance:', response);
});
```

**Expected output:**
```
Wallet Address: {address: "0xb4C5b2C1D3C0e06c8c3ECF9427Aa31b3e09D4B83"}
Balance: {eth: "0.0001", ...}
```

### **Test 3: x402 Payment Flow**

**Terminal 1 - Start Provider:**
```bash
cd lib/wallet
node dist/examples/x402/provider.js
```

**Terminal 2 - Start Consumer:**
```bash
node dist/examples/x402/consumer.js
```

**In Browser:**
1. Open wallet UI
2. Watch balance
3. Check transactions in console
4. Verify payment protocol working

---

## 🔧 Advanced: Build Full BrowserOS

If you want to build the complete BrowserOS browser:

### **Prerequisites**

- **Disk Space:** ~100GB free
- **RAM:** 16GB+ recommended
- **Time:** 1-3 hours for first build
- **OS:** Linux (Ubuntu/Debian recommended)

### **Step 1: Install Dependencies**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y \
  python3 python3-pip \
  git curl wget \
  build-essential \
  clang lld ninja-build \
  pkg-config \
  libnss3-dev libglib2.0-dev \
  libgtk-3-dev libdbus-1-dev \
  libatk-bridge2.0-dev libatspi2.0-dev \
  libx11-dev libxcomposite-dev libxdamage-dev \
  libxrandr-dev libgbm-dev libpango1.0-dev \
  libcairo2-dev libasound2-dev libpulse-dev \
  libdrm-dev libxss-dev libcups2-dev \
  libudev-dev
```

### **Step 2: Get Chromium Source**

**WARNING:** This downloads ~20GB and expands to ~100GB!

```bash
# Create directory
mkdir ~/chromium && cd ~/chromium

# Install depot_tools
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
export PATH="$PATH:$(pwd)/depot_tools"

# Get Chromium
fetch --nohooks chromium

# This takes 30-60 minutes depending on connection
```

### **Step 3: Build BrowserOS**

```bash
cd packages/browseros

# Configure build
python3 build/build.py \
  --chromium-src ~/chromium/src \
  --config build/config/debug.yaml \
  --configure

# Build (takes 1-3 hours)
python3 build/build.py \
  --chromium-src ~/chromium/src \
  --config build/config/debug.yaml \
  --build
```

### **Step 4: Launch BrowserOS**

```bash
# After successful build
python3 build/build.py \
  --chromium-src ~/chromium/src \
  --config build/config/debug.yaml \
  --run
```

### **Step 5: Load Wallet Extension in BrowserOS**

1. BrowserOS launches
2. Navigate to `browseros://extensions`
3. Enable Developer mode
4. Load unpacked: `packages/browseros-agent/extension/`
5. Wallet should appear!

---

## 📊 Verification Checklist

### **Before Launching:**

- [ ] Run `node verify-integration.js` → All 7/7 checks pass
- [ ] Check balance: `0.0001 ETH`
- [ ] Network connected: Base Sepolia
- [ ] Wallet config exists: `lib/wallet/wallet-config.json`

### **UI Verification:**

- [ ] Wallet UI loads in browser
- [ ] Shows correct address
- [ ] Shows correct balance
- [ ] All buttons clickable
- [ ] Feature cards interactive
- [ ] Can copy address
- [ ] External links work

### **Extension Verification:**

- [ ] Extension loads in Chrome
- [ ] Icon appears in toolbar
- [ ] Popup opens wallet UI
- [ ] Background service running
- [ ] Console shows no errors

### **Integration Verification:**

- [ ] Provider agent starts
- [ ] Consumer agent starts
- [ ] Payment protocol works
- [ ] Transactions visible
- [ ] Balance updates

---

## 🎯 Quick Verification Commands

```bash
# 1. Verify all components
node verify-integration.js

# 2. Open UI in browser
xdg-open packages/browseros-agent/wallet-ui-component.html

# 3. Test integration
node wallet-integration-example.js

# 4. Test x402 provider
cd lib/wallet && node dist/examples/x402/provider.js

# 5. Test x402 consumer
cd lib/wallet && node dist/examples/x402/consumer.js
```

---

## 🚨 Troubleshooting

### **Issue: UI doesn't load**

**Solution:**
```bash
# Check if file exists
ls -la packages/browseros-agent/wallet-ui-component.html

# Open directly
firefox packages/browseros-agent/wallet-ui-component.html
```

### **Issue: Balance shows 0.0000**

**Solution:**
```bash
# Check balance manually
cd lib/wallet && node -e "const {WalletManager,TestnetNetwork}=require('./dist/index');const c=require('./wallet-config.json');(async()=>{const w=new WalletManager();await w.getProvider().connect(TestnetNetwork.BASE_SEPOLIA);const b=await w.getBalance(c.address);console.log('Balance:',(parseFloat(b)/1e18).toFixed(4),'ETH');})();"

# If 0, get more tokens:
# Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
```

### **Issue: Extension won't load**

**Solution:**
```bash
# Check manifest
cat packages/browseros-agent/extension/manifest.json

# Check for errors in chrome://extensions
# Enable Developer mode and check error messages
```

### **Issue: x402 payments failing**

**Solution:**
```bash
# Check network connection
cd lib/wallet && node test-connection.js

# Verify wallet has ETH
# Payment needs USDC (different from ETH)
# Consumer example will show "Insufficient USDC" - this is expected
```

---

## 🎉 Success Criteria

You'll know everything is working when:

### **✅ Standalone UI:**
- Opens in browser without errors
- Shows your wallet info correctly
- All buttons work
- Feature cards are interactive

### **✅ Chrome Extension:**
- Loads without errors
- Icon appears in toolbar
- Clicking icon opens wallet
- Background service running

### **✅ Integration:**
- Wallet connects to Base Sepolia
- Balance displays correctly
- Transactions can be viewed
- x402 protocol working

### **✅ Agent Payments:**
- Provider agent registers services
- Consumer agent discovers services
- Payments attempted (may fail without USDC - expected)
- Protocol communication working

---

## 📚 Next Steps

Once verification is complete:

1. **Customize UI** - Edit `wallet-ui-component.html`
2. **Add Features** - Modify `wallet-integration-example.js`
3. **Build Agents** - Create agents that use x402
4. **Deploy** - Integrate into production BrowserOS

---

## 🔗 Related Documentation

- [INTEGRATION-VERIFICATION-STEPS.md](INTEGRATION-VERIFICATION-STEPS.md) - Complete verification guide
- [BrowserOS-Integration-Guide.md](BrowserOS-Integration-Guide.md) - Integration details
- [BROWSEROS-QUICK-START.md](BROWSEROS-QUICK-START.md) - Quick reference
- [docs/wallet/X402_GUIDE.md](docs/wallet/X402_GUIDE.md) - Payment protocol

---

## ✅ Summary

**Recommended Path:**

1. ✅ Test standalone UI (5 min)
2. ✅ Load as Chrome extension (15 min)
3. ✅ Verify all functionality
4. 🔄 Build full BrowserOS (optional, 3+ hours)

**You're ready when:**
- UI loads and displays correctly
- All buttons work
- Balance shows
- x402 examples run

**Ready to launch?** Start with the standalone UI test above! 🚀
