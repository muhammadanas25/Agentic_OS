# 🚀 BrowserOS Wallet - Complete Launch Guide

Your wallet is now **fully integrated** into BrowserOS! This guide will help you launch and test it.

---

## 🎯 What's Been Integrated

✅ **Wallet Library Bundle** (`wallet.js`) - 1.5MB browser-compatible wallet
✅ **Complete UI Components** - Modern dark-themed interface
✅ **Network Connectivity** - Base Sepolia testnet support
✅ **x402 Payment Protocol** - Ready for AI agent payments
✅ **Chrome Extension Permissions** - All required permissions added

---

## 🚀 Quick Start (3 Steps)

### Step 1: Download Browser OS

Choose your platform:

**macOS**:
```bash
curl -L https://files.browseros.com/download/BrowserOS.dmg -o BrowserOS.dmg
open BrowserOS.dmg
# Drag BrowserOS to Applications folder
```

**Linux**:
```bash
curl -L https://files.browseros.com/download/BrowserOS.AppImage -o BrowserOS.AppImage
chmod +x BrowserOS.AppImage
./BrowserOS.AppImage
```

**Windows**:
Download from: `https://files.browseros.com/download/BrowserOS_installer.exe`

### Step 2: Load the Wallet Extension

1. Launch BrowserOS
2. Open extensions page:
   - Click menu (⋮) → More Tools → Extensions
   - Or navigate to: `chrome://extensions`

3. **Enable Developer Mode**:
   - Toggle the switch in top-right corner

4. **Load Wallet Extension**:
   - Click "Load unpacked"
   - Navigate to: `/home/user/Agentic_OS/packages/browseros/resources/files/ai_side_panel`
   - Click "Select Folder"

5. **Verify Extension Loaded**:
   - You should see "Agent" extension with version 40
   - Extension should be enabled (toggle should be blue)

### Step 3: Open Wallet

1. Open the side panel:
   - Press `Ctrl+E` (Windows/Linux) or `Cmd+E` (macOS)
   - Or click the Agent icon in toolbar

2. **Look for the wallet button**:
   - You'll see a purple gradient button with 💰 emoji
   - Located in bottom-right of the side panel

3. **Click the wallet button**:
   - Wallet panel will slide in from the right

---

## 💳 Create Your First Wallet

Once the wallet panel opens:

1. **You'll see the setup screen**:
   ```
   🔐 BrowserOS Wallet

   Create Your Wallet
   Set up a wallet to enable x402 payments for AI agents

   Password: [__________________]

   [Create Wallet]

   ⚠️ Important: Save your password securely!
   ```

2. **Enter a strong password** (minimum 8 characters)

3. **Click "Create Wallet"**:
   - Wallet will be generated
   - You'll see your wallet address
   - **IMPORTANT**: Save this address and password!

4. **Dashboard will appear**:
   ```
   Balance
   0.0000 ETH
   0 USDC

   Your Address
   0x1234...abcd [📋]

   ● Connected to Base Sepolia

   [🔄 Refresh] [💧 Faucet] [💸 x402]
   ```

---

## 💰 Get Testnet Tokens

Your wallet needs testnet ETH to pay for transaction gas fees:

### Method 1: Use Built-in Faucet Button

1. Click the **💧 Faucet** button in wallet
2. Coinbase faucet page will open in new tab
3. Follow the instructions:
   - Your wallet address is pre-filled
   - Complete any verification (if required)
   - Click "Send me ETH"
4. Wait 1-2 minutes for tokens to arrive
5. Click **🔄 Refresh** to update balance

### Method 2: Manual Faucet Request

Visit: `https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet`

1. Copy your wallet address (click 📋 button)
2. Paste into faucet website
3. Request tokens
4. Wait for confirmation

### Verification

After requesting tokens:
- Click 🔄 Refresh button
- Balance should update to show ETH (usually 0.0001-0.001 ETH)
- This is enough for hundreds of transactions!

---

## 🧪 Testing the Wallet

### Test 1: Basic Functionality

✅ **Open/Close Wallet**:
- Click 💰 button to toggle wallet panel
- Wallet should slide in/out smoothly

✅ **Copy Address**:
- Click 📋 button next to your address
- Should show ✓ briefly when copied
- Paste somewhere to verify

✅ **Refresh Balance**:
- Click 🔄 Refresh button
- Balance should update (shows "Loading..." then actual balance)

### Test 2: Network Connection

Check console logs:
1. Press `F12` to open DevTools
2. Go to Console tab
3. Look for:
   ```
   [Wallet UI] Initializing...
   [Wallet UI] WalletManager created
   [Wallet UI] Loaded existing wallet: 0x...
   [Wallet UI] Connected to Base Sepolia
   [Wallet UI] Balances updated
   ```

### Test 3: x402 Information

Click **💸 x402** button:
- Should show popup with x402 protocol info
- Displays your wallet address
- Explains x402 payment flow

---

## 🐛 Troubleshooting

### Wallet Button Not Showing

**Check**:
1. Extension is loaded and enabled
2. Side panel is open (`Ctrl+E` or `Cmd+E`)
3. Look in bottom-right corner of side panel

**Fix**:
```bash
# Reload the extension
cd /home/user/Agentic_OS/packages/browseros/resources/files/ai_side_panel
# Make sure wallet.js exists (should be ~1.5MB)
ls -lh wallet.js
```

### Wallet Library Not Loading

**Open DevTools Console** (F12):

**If you see**: `[Wallet UI] BrowserOSWallet library not found!`
- wallet.js didn't load properly
- Rebuild: `./scripts/integrate-wallet.sh`

**If you see**: Network errors or connection failures
- RPC endpoints may be unreachable
- This is OK for testing - wallet still works offline

### Balance Shows "Error loading balance"

**Possible causes**:
1. Network not connected (this is OK, expected in some environments)
2. RPC endpoint rate limiting
3. No internet connection

**Solution**:
- Wallet creation and storage still work
- x402 functionality requires network connection
- Can test offline features first

### Extension Won't Load

**Check permissions**:
1. manifest.json has all required permissions:
   - storage ✓
   - notifications ✓
   - webRequest ✓
   - webRequestBlocking ✓

**Verify files exist**:
```bash
ls -l packages/browseros/resources/files/ai_side_panel/
# Should see:
# wallet.js (~1.5MB)
# wallet-ui.js (~12KB)
# wallet-panel.css (~3KB)
# wallet-panel.html (~2KB)
# manifest.json
# sidepanel.html
# sidepanel.js
```

---

## 📊 Console Messages Reference

### Normal Operation

```
[Wallet UI] Initializing...
[Wallet UI] Starting initialization
[WalletManager] WalletManager initialized
[Wallet UI] WalletManager created
[Wallet UI] Loaded existing wallet: 0x...
[Wallet UI] UI injected
[Wallet UI] Event listeners attached
[Wallet UI] Initialization complete
[Wallet UI] Script loaded
```

### First Time (No Wallet)

```
[Wallet UI] Initializing...
[Wallet UI] Starting initialization
[WalletManager] WalletManager initialized
[Wallet UI] WalletManager created
[Wallet UI] UI injected
[Wallet UI] Event listeners attached
```

### After Creating Wallet

```
[Wallet UI] Wallet created: 0x...
[Wallet UI] Connected to Base Sepolia
[Wallet UI] Balances updated
```

---

## 🎮 Advanced Testing

### Test x402 Payment Flow

1. **Run Provider Example** (in terminal):
   ```bash
   cd /home/user/Agentic_OS/lib/wallet
   npm run example:x402:provider
   ```

2. **Copy provider's wallet address** from console output

3. **In BrowserOS wallet**:
   - Note your consumer wallet address
   - Use it to simulate payments

4. **Test payment detection**:
   - Provider should log when payments are detected
   - Wallet UI will show transactions in "Recent Activity"

### Test Storage Persistence

1. **Create wallet** in BrowserOS
2. **Close and reopen BrowserOS**
3. **Open wallet panel**:
   - Should automatically load your existing wallet
   - No need to create again
   - Balance should be remembered

### Test Multiple Wallets

Wallets are stored in:
- **Browser**: `localStorage` or `chrome.storage`
- **File location** (for reference): `~/.browseros-wallet/browseros_wallet.json`

---

## 📝 Next Steps

### 1. Fund Your Wallet
- Get testnet ETH from faucet
- Verify balance shows correctly

### 2. Get USDC (Optional)
For x402 payments, you'll need testnet USDC:
- Most x402 transactions use USDC
- Can get from Circle's testnet faucet
- Or swap testnet ETH for testnet USDC on DEX

### 3. Try x402 Payments
- Run provider example
- Make test payments between wallets
- See transactions in "Recent Activity"

### 4. Customize UI
Want to modify the wallet UI?
- Edit: `wallet-panel.html` (structure)
- Edit: `wallet-panel.css` (styling)
- Edit: `wallet-ui.js` (functionality)
- Reload extension to see changes

---

## 🆘 Getting Help

**Check logs**:
```bash
# Browser console
F12 → Console tab

# Look for wallet-related messages
# Filter by: "Wallet"
```

**Verify integration**:
```bash
cd /home/user/Agentic_OS
./verify-integration.js
```

**Review documentation**:
- `docs/wallet/BROWSER_INTEGRATION.md` - Full integration guide
- `docs/wallet/README.md` - Wallet library docs
- `docs/wallet/X402_GUIDE.md` - x402 protocol docs

**Community support**:
- Discord: https://discord.gg/YKwjt5vuKr
- GitHub Issues: https://github.com/browseros-ai/BrowserOS/issues

---

## ✅ Success Checklist

Before reporting issues, verify:

- [ ] BrowserOS is running
- [ ] Extension is loaded and enabled
- [ ] Side panel opens with `Ctrl+E`
- [ ] Wallet button (💰) is visible
- [ ] Wallet panel opens when clicked
- [ ] Can create or see existing wallet
- [ ] Address can be copied
- [ ] Faucet button opens correct URL
- [ ] Console shows no critical errors

---

## 🎉 You're Ready!

Your BrowserOS now has a fully functional blockchain wallet with:
- ✅ Secure wallet creation and storage
- ✅ Balance checking and refresh
- ✅ Testnet token acquisition
- ✅ x402 payment protocol support
- ✅ Beautiful, modern UI
- ✅ Production-ready architecture

**Start building AI agents that can make and receive payments!** 🚀
