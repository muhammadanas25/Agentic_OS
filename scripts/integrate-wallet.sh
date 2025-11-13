#!/bin/bash

# BrowserOS Wallet Integration Script
# This script helps set up the wallet library for browser integration

set -e

echo "================================================"
echo "BrowserOS Wallet Integration Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "lib/wallet" ]; then
    echo -e "${RED}Error: Please run this script from the Agentic_OS root directory${NC}"
    exit 1
fi

echo "Step 1: Building wallet library..."
cd lib/wallet

# Build TypeScript
echo "  → Compiling TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Please fix TypeScript errors first.${NC}"
    exit 1
fi

echo -e "${GREEN}  ✓ TypeScript compiled successfully${NC}"

# Check if browserify is installed
if ! npm list browserify > /dev/null 2>&1; then
    echo "  → Installing browserify..."
    npm install --save-dev browserify
fi

# Create browser bundle
echo "  → Creating browser bundle..."
npx browserify dist/index.js \
    --standalone BrowserOSWallet \
    --outfile ../../packages/browseros/resources/files/ai_side_panel/wallet.js

echo -e "${GREEN}  ✓ Browser bundle created${NC}"

cd ../..

echo ""
echo "Step 2: Setting up browser resources..."

# Create wallet panel HTML
WALLET_PANEL_DIR="packages/browseros/resources/files/ai_side_panel"

if [ ! -f "$WALLET_PANEL_DIR/wallet-panel.html" ]; then
    echo "  → Creating wallet-panel.html..."
    cat > "$WALLET_PANEL_DIR/wallet-panel.html" << 'EOF'
<div id="wallet-panel" class="wallet-panel" style="display:none;">
  <div class="wallet-header">
    <h2>🔐 Wallet</h2>
    <button id="wallet-close-btn" class="icon-btn">✕</button>
  </div>

  <div id="wallet-content">
    <!-- Wallet setup -->
    <div id="wallet-setup" class="wallet-section">
      <h3>Create Your Wallet</h3>
      <p>Enable x402 payments for AI agents</p>
      <input type="password" id="wallet-password" placeholder="Enter password" class="wallet-input" />
      <button id="create-wallet-btn" class="primary-btn">Create Wallet</button>
    </div>

    <!-- Wallet dashboard -->
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
        <button id="faucet-btn" class="action-btn">Faucet</button>
        <button id="refresh-btn" class="action-btn">Refresh</button>
      </div>

      <div class="payment-history">
        <h4>Recent Activity</h4>
        <div id="payment-list" class="payment-list">
          <p class="empty-state">No transactions yet</p>
        </div>
      </div>
    </div>
  </div>
</div>
EOF
    echo -e "${GREEN}  ✓ wallet-panel.html created${NC}"
else
    echo -e "${YELLOW}  ⚠ wallet-panel.html already exists, skipping${NC}"
fi

# Create minimal wallet UI script
if [ ! -f "$WALLET_PANEL_DIR/wallet-ui.js" ]; then
    echo "  → Creating wallet-ui.js..."
    cat > "$WALLET_PANEL_DIR/wallet-ui.js" << 'EOF'
// Minimal wallet UI initialization
console.log('[BrowserOS Wallet] UI initializing...');

// Wait for wallet library to load
setTimeout(() => {
  if (typeof BrowserOSWallet !== 'undefined') {
    console.log('[BrowserOS Wallet] Library loaded successfully');
    // Initialize wallet UI here
  } else {
    console.error('[BrowserOS Wallet] Library not found');
  }
}, 1000);
EOF
    echo -e "${GREEN}  ✓ wallet-ui.js created${NC}"
else
    echo -e "${YELLOW}  ⚠ wallet-ui.js already exists, skipping${NC}"
fi

# Create CSS file
if [ ! -f "$WALLET_PANEL_DIR/wallet-panel.css" ]; then
    echo "  → Creating wallet-panel.css..."
    cat > "$WALLET_PANEL_DIR/wallet-panel.css" << 'EOF'
.wallet-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 320px;
  height: 100%;
  background: #1a1a1b;
  color: #fff;
  box-shadow: -2px 0 8px rgba(0,0,0,0.3);
  z-index: 10000;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
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
  font-size: 16px;
  font-weight: 600;
}

.icon-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
}

.wallet-section {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.wallet-input {
  width: 100%;
  padding: 12px;
  background: #2d2d2e;
  border: 1px solid #3d3d3e;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  margin-bottom: 12px;
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
  font-size: 14px;
}

.primary-btn:hover {
  background: #5568d3;
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
  font-size: 20px;
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
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallet-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.action-btn {
  padding: 10px;
  background: #2d2d2e;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.action-btn:hover {
  background: #3d3d3e;
}

.payment-history h4 {
  font-size: 14px;
  margin: 0 0 12px 0;
}

.payment-list {
  max-height: 200px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  color: #666;
  font-size: 13px;
  padding: 20px;
}
EOF
    echo -e "${GREEN}  ✓ wallet-panel.css created${NC}"
else
    echo -e "${YELLOW}  ⚠ wallet-panel.css already exists, skipping${NC}"
fi

echo ""
echo "Step 3: Verifying files..."
echo ""

# Check created files
FILES_TO_CHECK=(
    "packages/browseros/resources/files/ai_side_panel/wallet.js"
    "packages/browseros/resources/files/ai_side_panel/wallet-panel.html"
    "packages/browseros/resources/files/ai_side_panel/wallet-ui.js"
    "packages/browseros/resources/files/ai_side_panel/wallet-panel.css"
)

ALL_GOOD=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        SIZE=$(du -h "$file" | cut -f1)
        echo -e "${GREEN}  ✓${NC} $file ($SIZE)"
    else
        echo -e "${RED}  ✗${NC} $file (missing)"
        ALL_GOOD=false
    fi
done

echo ""
if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✓ Wallet integration setup complete!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Download BrowserOS: https://files.browseros.com/download/"
    echo "  2. Open BrowserOS and go to: chrome://extensions"
    echo "  3. Enable 'Developer mode'"
    echo "  4. Click 'Load unpacked'"
    echo "  5. Select: packages/browseros/resources/files/ai_side_panel"
    echo "  6. Test wallet functionality"
    echo ""
    echo "Documentation: docs/wallet/BROWSER_INTEGRATION.md"
else
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}Setup incomplete - some files missing${NC}"
    echo -e "${RED}================================================${NC}"
    exit 1
fi
