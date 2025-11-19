#!/bin/bash

# Titan Browser Quick Start
# This script creates a Titan-branded extension for testing
# WITHOUT requiring a full Chromium build

set -e

echo "════════════════════════════════════════════"
echo "  Titan Browser - Quick Start Setup"
echo "════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SIDE_PANEL_DIR="$SCRIPT_DIR/resources/files/ai_side_panel"
TITAN_DIR="$SCRIPT_DIR/resources/files/titan_agent"

echo -e "${BLUE}Step 1: Creating Titan Agent Directory${NC}"
# Copy side panel to new Titan directory
cp -r "$SIDE_PANEL_DIR" "$TITAN_DIR"
echo -e "${GREEN}✓ Created Titan agent directory${NC}\n"

echo -e "${BLUE}Step 2: Updating Titan Manifest${NC}"
# Update manifest.json for Titan branding
cd "$TITAN_DIR"

# Backup original
cp manifest.json manifest.json.backup

# Update manifest with Titan branding
cat > manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "Titan Agent",
  "version": "1.0.0",
  "description": "Titan Browser - Enhanced AI browser with built-in crypto wallet and x402 payments",
  "key": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDC0C0AakL+XOcj+PMf24WqoKHA/hhypDQZUUd9sJr/c7cx3nLJS+kaJaB+cz8V3RhPZq01BFeByofLg6Hg6ZNVvBVn3wtGLcNPmuCwMmDiHetTV0oJsFOWs2VznP9py1ww5FFhU+Wmw1CWyLJqnwsIsLLCQyUXAZpVEOLJlOqX1wIDAQAB",
  "permissions": [
    "activeTab",
    "storage",
    "scripting",
    "tabs",
    "tabGroups",
    "sidePanel",
    "bookmarks",
    "history",
    "notifications",
    "webRequest",
    "webRequestBlocking"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_icon": {
      "16": "assets/icon16.png",
      "48": "assets/icon48.png",
      "128": "assets/icon128.png"
    },
    "default_title": "Titan Browser"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "commands": {
    "toggle-panel": {
      "suggested_key": {
        "default": "Ctrl+T",
        "mac": "Command+T"
      },
      "description": "Toggle the Titan side panel"
    }
  },
  "content_scripts": [
    {
      "matches": [
        "<all_urls>"
      ],
      "js": [
        "content.js"
      ],
      "run_at": "document_start",
      "all_frames": true
    }
  ],
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  },
  "component": true
}
EOF

echo -e "${GREEN}✓ Updated manifest for Titan branding${NC}\n"

echo -e "${BLUE}Step 3: Updating Side Panel HTML${NC}"
# Update sidepanel.html title
sed -i.bak 's/<title>.*<\/title>/<title>Titan Browser<\/title>/g' sidepanel.html
sed -i.bak 's/BrowserOS/Titan/g' sidepanel.html

echo -e "${GREEN}✓ Updated side panel with Titan branding${NC}\n"

echo -e "${BLUE}Step 4: Updating Wallet UI${NC}"
# Update wallet-ui.js to show Titan branding
sed -i.bak 's/BrowserOS Wallet/Titan Wallet/g' wallet-ui.js

# Update wallet panel HTML header
cat > titan_wallet_header.txt << 'EOF'
          <div class="wallet-header">
            <h2>🔐 Titan Wallet</h2>
            <button id="wallet-close-btn" class="icon-btn">✕</button>
          </div>
EOF

echo -e "${GREEN}✓ Updated wallet UI for Titan${NC}\n"

echo -e "${BLUE}Step 5: Removing Chat Components${NC}"
# Remove chat-related files if they exist
rm -f chat*.js llm*.js hub*.js 2>/dev/null || true
echo -e "${GREEN}✓ Removed chat components${NC}\n"

echo -e "${BLUE}Step 6: Creating Titan Welcome Message${NC}"
# Create a welcome message in the console
cat >> wallet-ui.js << 'EOF'

// Titan Browser Welcome
console.log('%c🚀 Titan Browser', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log('%cEnhanced AI Browser with Crypto Wallet & x402 Payments', 'font-size: 12px; color: #999;');
console.log('%cVersion 1.0.0', 'font-size: 10px; color: #666;');
EOF

echo -e "${GREEN}✓ Added Titan welcome message${NC}\n"

echo -e "${BLUE}Step 7: Verification${NC}"
# Verify key files exist
FILES_TO_CHECK=(
    "manifest.json"
    "sidepanel.html"
    "wallet.js"
    "wallet-ui.js"
    "wallet-panel.css"
)

ALL_GOOD=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}  ✓${NC} $file"
    else
        echo -e "${RED}  ✗${NC} $file (missing)"
        ALL_GOOD=false
    fi
done

echo ""
if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ Titan Agent Setup Complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Download BrowserOS from: https://files.browseros.com/download/"
    echo "  2. Open BrowserOS and go to: chrome://extensions"
    echo "  3. Enable 'Developer mode'"
    echo "  4. Click 'Load unpacked'"
    echo "  5. Select: $TITAN_DIR"
    echo "  6. Press Ctrl+T (or Cmd+T) to open Titan panel"
    echo "  7. Click 💰 to access Titan Wallet"
    echo ""
    echo "Titan Agent location:"
    echo "  $TITAN_DIR"
    echo ""
    echo "Documentation:"
    echo "  - Full Build Guide: /home/user/Agentic_OS/TITAN-BROWSER-BUILD-GUIDE.md"
    echo "  - Wallet Guide: /home/user/Agentic_OS/BROWSEROS-WALLET-LAUNCH-GUIDE.md"
    echo ""
else
    echo -e "${YELLOW}════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠ Setup completed with warnings${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════${NC}"
fi
