# 🏗️ Titan Browser - Complete Build Guide

This guide will help you create **Titan Browser** - a custom branded Chromium-based browser with built-in wallet and x402 support, based on BrowserOS.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Rebranding Strategy](#rebranding-strategy)
4. [Removing Chat Mode](#removing-chat-mode)
5. [Integrating Wallet as Core Feature](#integrating-wallet-as-core-feature)
6. [Build Configuration](#build-configuration)
7. [Building Titan](#building-titan)
8. [Testing & Deployment](#testing--deployment)

---

## 🏛️ Architecture Overview

### What We're Building

```
Titan Browser Architecture
┌─────────────────────────────────────────┐
│         Titan Browser (Chromium)        │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Core Wallet (Built-in)          │  │
│  │  - WalletManager                 │  │
│  │  - X402Manager                   │  │
│  │  - TokenManager                  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Titan UI                        │  │
│  │  - Custom Branding               │  │
│  │  - Wallet Interface              │  │
│  │  - Settings Pages                │  │
│  │  - NO Chat Mode                  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Enhanced Features               │  │
│  │  - x402 Protocol Handler         │  │
│  │  - Payment Interception          │  │
│  │  │  - Agent Marketplace          │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Key Differences from BrowserOS

| Feature | BrowserOS | Titan Browser |
|---------|-----------|---------------|
| **Branding** | BrowserOS/Nxtscape | Titan |
| **Chat Mode** | ✅ Enabled | ❌ Removed |
| **Wallet** | Extension only | ✅ Built-in Core |
| **x402 Support** | Optional | ✅ Native |
| **UI** | Open source branding | Custom Titan UI |
| **Target Audience** | General AI users | Crypto/AI agents |

---

## 🔧 Prerequisites

### Required Software

```bash
# 1. Python 3.8+
python3 --version

# 2. Node.js 18+
node --version
npm --version

# 3. Git
git --version

# 4. Build tools (varies by platform)
```

### Platform-Specific Build Tools

**macOS**:
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install depot_tools (Chromium build system)
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
echo 'export PATH="$PATH:${HOME}/depot_tools"' >> ~/.zshrc
```

**Linux (Ubuntu/Debian)**:
```bash
# Install build dependencies
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  curl \
  git \
  python3 \
  python3-pip \
  lsb-release \
  sudo

# Install depot_tools
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
echo 'export PATH="$PATH:${HOME}/depot_tools"' >> ~/.bashrc
```

**Windows**:
```powershell
# Install Visual Studio 2022 (Community Edition)
# - Include "Desktop development with C++"
# - Include "Windows 10/11 SDK"

# Install depot_tools
# Download from: https://storage.googleapis.com/chrome-infra/depot_tools.zip
# Add to PATH
```

### Disk Space & Hardware

- **Disk Space**: 100GB+ free (Chromium source is large!)
- **RAM**: 16GB minimum, 32GB recommended
- **CPU**: Multi-core processor (8+ cores recommended)
- **Build Time**: 2-8 hours depending on hardware

---

## 🎨 Rebranding Strategy

### Step 1: Create Titan Branding Files

Create a new directory structure:

```bash
cd /home/user/Agentic_OS/packages/browseros
mkdir -p titan_branding/{icons,logos,assets}
```

### Step 2: Brand Identity Files Needed

1. **Application Icon** (titan_branding/icons/):
   - `app_icon.icns` (macOS) - 1024x1024
   - `app_icon.ico` (Windows) - 256x256
   - `app_icon.png` (Linux) - 512x512

2. **Product Logos** (titan_branding/logos/):
   - `titan_logo.svg` - Main logo
   - `titan_wordmark.svg` - Titan text logo
   - `titan_icon_small.png` - 16x16, 32x32, 48x48

3. **Splash Screen** (titan_branding/assets/):
   - `splash.png` - 800x600

### Step 3: Create Titan Features Configuration

Create `titan_branding/features.yaml`:

```yaml
version: '1.0'
features:
  # Titan Branding
  titan-branding-core:
    description: 'Titan Browser core branding'
    files:
    - chrome/common/chrome_constants.cc
    - chrome/common/chrome_paths_linux.cc
    - chrome/install_static/chromium_install_modes.cc
    - chrome/install_static/chromium_install_modes.h

  titan-ui-customization:
    description: 'Titan custom UI elements'
    files:
    - chrome/browser/ui/views/frame/browser_view.cc
    - chrome/browser/ui/views/toolbar/toolbar_view.cc

  titan-wallet-integration:
    description: 'Built-in wallet for Titan'
    files:
    - chrome/browser/ui/views/wallet/wallet_view.cc
    - chrome/browser/ui/views/wallet/wallet_view.h
    - chrome/browser/ui/BUILD.gn

  titan-x402-handler:
    description: 'Native x402 protocol support'
    files:
    - chrome/browser/net/x402_interceptor.cc
    - chrome/browser/net/x402_interceptor.h

  # Disabled features (from BrowserOS)
  # browseros-llm-chat: DISABLED
  # browseros-pin-chat-and-hub: DISABLED
  # browseros-updates-llm-chat-and-hub: DISABLED
```

### Step 4: Branding Constants

Create `titan_branding/constants.py`:

```python
"""
Titan Browser Branding Constants
"""

# Product Information
PRODUCT_NAME = "Titan"
PRODUCT_FULLNAME = "Titan Browser"
COMPANY_NAME = "Your Company Name"
COMPANY_SHORTNAME = "YourCompany"

# Version
MAJOR_VERSION = "1"
MINOR_VERSION = "0"
BUILD_VERSION = "0"
PATCH_VERSION = "0"

# Branding Strings
ABOUT_TEXT = "Titan Browser - Enhanced browser with crypto wallet and AI agent support"
COPYRIGHT_TEXT = "Copyright © 2025 Your Company. All rights reserved."

# URLs
HOMEPAGE_URL = "https://titan-browser.com"
SUPPORT_URL = "https://titan-browser.com/support"
UPDATE_URL = "https://titan-browser.com/update"

# Identifiers (reverse DNS)
BUNDLE_ID_MAC = "com.yourcompany.titan"
APP_ID_LINUX = "com.yourcompany.Titan"
APP_USER_MODEL_ID_WIN = "YourCompany.Titan"

# Paths
USER_DATA_DIR_BASENAME = "TitanBrowser"
PROFILE_DIR_BASENAME = "Titan"

# Feature Flags
ENABLE_WALLET = True
ENABLE_X402 = True
ENABLE_CHAT = False  # DISABLED
ENABLE_HUB = False   # DISABLED
```

---

## 🚫 Removing Chat Mode

### Step 1: Identify Chat Features

Chat-related features to disable:
- `browseros-llm-chat`
- `browseros-pin-chat-and-hub`
- `browseros-updates-llm-chat-and-hub`
- Chat icons and vector graphics

### Step 2: Create Feature Exclusion List

Create `titan_branding/excluded_features.txt`:

```
# Chat Mode Features (EXCLUDED from Titan)
browseros-llm-chat
browseros-pin-chat-and-hub
browseros-updates-llm-chat-and-hub

# Keep these features
browseros-branding-file-updates
browseros-browseros-ai-settings-page
browseros-browseros-api
browseros-browseros-metrics
```

### Step 3: Modify Build Script

Edit `packages/browseros/build/build.py`:

```python
# Add near the top of build.py

# Titan Browser Customization
EXCLUDED_FEATURES = [
    'browseros-llm-chat',
    'browseros-pin-chat-and-hub',
    'browseros-updates-llm-chat-and-hub',
]

def should_include_feature(feature_name):
    """Check if feature should be included in Titan build"""
    if feature_name in EXCLUDED_FEATURES:
        return False
    return True

# Then modify the feature loading section to use this filter
```

### Step 4: Remove Chat UI Elements

Create patch file `chromium_patches/titan/remove_chat_ui.patch`:

```diff
--- a/chrome/browser/ui/views/toolbar/toolbar_view.cc
+++ b/chrome/browser/ui/views/toolbar/toolbar_view.cc
@@ -XXX,XX +XXX,XX @@
-  // Add chat button
-  chat_button_ = new ChatButton();
-  AddChildView(chat_button_);
+  // Chat button removed in Titan Browser
```

---

## 💰 Integrating Wallet as Core Feature

### Step 1: Move Wallet from Extension to Core

Current structure:
```
packages/browseros/resources/files/ai_side_panel/
├── wallet.js (extension)
├── wallet-ui.js
└── wallet-panel.css
```

New structure for Titan:
```
chromium_patches/titan/chrome/browser/ui/views/wallet/
├── wallet_manager.cc
├── wallet_manager.h
├── wallet_view.cc
├── wallet_view.h
├── x402_handler.cc
└── x402_handler.h
```

### Step 2: Create C++ Wallet Integration

Create `chromium_patches/titan/chrome/browser/ui/views/wallet/wallet_view.h`:

```cpp
#ifndef CHROME_BROWSER_UI_VIEWS_WALLET_WALLET_VIEW_H_
#define CHROME_BROWSER_UI_VIEWS_WALLET_WALLET_VIEW_H_

#include "ui/views/view.h"
#include "ui/views/controls/button/button.h"

namespace titan {

class WalletView : public views::View {
 public:
  WalletView();
  ~WalletView() override;

  // Called when wallet button is clicked
  void OnWalletButtonPressed();

  // Update wallet balance
  void UpdateBalance();

 private:
  // Wallet UI components
  views::Button* wallet_button_;
  views::View* wallet_panel_;

  // Wallet state
  std::string wallet_address_;
  std::string eth_balance_;
  std::string usdc_balance_;
};

}  // namespace titan

#endif  // CHROME_BROWSER_UI_VIEWS_WALLET_WALLET_VIEW_H_
```

### Step 3: Integrate Wallet into Browser UI

Create `chromium_patches/titan/chrome/browser/ui/views/wallet/wallet_integration.patch`:

```diff
--- a/chrome/browser/ui/views/frame/browser_view.cc
+++ b/chrome/browser/ui/views/frame/browser_view.cc
@@ -XXX,XX +XXX,XX @@
+#include "chrome/browser/ui/views/wallet/wallet_view.h"
+
 BrowserView::BrowserView(std::unique_ptr<Browser> browser)
     : AnimatedWebView(browser->profile()),
@@ -XXX,XX +XXX,XX @@
+  // Add Titan wallet to toolbar
+  wallet_view_ = new titan::WalletView();
+  toolbar_->AddChildView(wallet_view_);
```

### Step 4: Wallet JavaScript Bridge

The wallet needs to communicate with the JavaScript library. Create:

`chromium_patches/titan/chrome/browser/ui/webui/wallet/wallet_ui.cc`:

```cpp
#include "chrome/browser/ui/webui/wallet/wallet_ui.h"

#include "base/values.h"
#include "chrome/browser/profiles/profile.h"
#include "chrome/common/webui_url_constants.h"
#include "content/public/browser/web_ui.h"
#include "content/public/browser/web_ui_data_source.h"

TitanWalletUI::TitanWalletUI(content::WebUI* web_ui)
    : content::WebUIController(web_ui) {

  // Create data source
  content::WebUIDataSource* source =
      content::WebUIDataSource::Create(chrome::kChromeUITitanWalletHost);

  // Add wallet resources
  source->AddResourcePath("wallet.js", IDR_TITAN_WALLET_JS);
  source->AddResourcePath("wallet.css", IDR_TITAN_WALLET_CSS);
  source->SetDefaultResource(IDR_TITAN_WALLET_HTML);

  // Add to profile
  Profile* profile = Profile::FromWebUI(web_ui);
  content::WebUIDataSource::Add(profile, source);
}
```

---

## ⚙️ Build Configuration

### Step 1: Create Titan Build Configuration

Create `packages/browseros/build/config/titan.yaml`:

```yaml
name: "Titan Browser"
version: "1.0.0"
product_name: "Titan"
company_name: "YourCompany"

# Build settings
build_type: "release"
target_cpu: "x64"

# Branding
branding:
  product_name: "Titan"
  product_fullname: "Titan Browser"
  company: "Your Company"
  bundle_id: "com.yourcompany.titan"

# Features to include
features:
  - titan-branding-core
  - titan-ui-customization
  - titan-wallet-integration
  - titan-x402-handler
  - browseros-browseros-api
  - browseros-browseros-metrics

# Features to exclude
exclude_features:
  - browseros-llm-chat
  - browseros-pin-chat-and-hub
  - browseros-updates-llm-chat-and-hub

# Wallet configuration
wallet:
  enabled: true
  built_in: true
  networks:
    - base-sepolia
    - ethereum-sepolia
    - polygon-mumbai

# x402 configuration
x402:
  enabled: true
  auto_detect: true
  payment_timeout: 300000
```

### Step 2: Create Titan Build Script

Create `packages/browseros/build_titan.py`:

```python
#!/usr/bin/env python3
"""
Titan Browser Build Script
Builds a custom branded browser with wallet and x402 support
"""

import os
import sys
import yaml
from pathlib import Path

# Import BrowserOS build utilities
from build import BuildContext, apply_patches, configure_gn

TITAN_CONFIG = "build/config/titan.yaml"

def load_titan_config():
    """Load Titan-specific configuration"""
    with open(TITAN_CONFIG, 'r') as f:
        return yaml.safe_load(f)

def apply_titan_branding(config):
    """Apply Titan branding to Chromium source"""
    print("Applying Titan branding...")

    # Replace BrowserOS strings with Titan
    replacements = {
        'BrowserOS': config['branding']['product_name'],
        'browseros': config['branding']['product_name'].lower(),
        'Nxtscape': config['branding']['product_fullname'],
    }

    # Apply replacements to source files
    # ... implementation here

def remove_chat_features(config):
    """Remove chat mode features"""
    print("Removing chat features...")

    excluded = config.get('exclude_features', [])
    # Remove patches for excluded features
    # ... implementation here

def integrate_wallet(config):
    """Integrate wallet as core feature"""
    print("Integrating wallet...")

    # Copy wallet sources to Chromium
    wallet_src = Path("../../lib/wallet/dist")
    chromium_wallet = Path("chromium/chrome/browser/ui/webui/wallet")

    # ... implementation here

def build_titan(args):
    """Main build function"""
    config = load_titan_config()

    print(f"Building {config['branding']['product_fullname']}...")
    print(f"Version: {config['version']}")

    # 1. Apply Titan branding
    apply_titan_branding(config)

    # 2. Remove chat features
    remove_chat_features(config)

    # 3. Integrate wallet
    integrate_wallet(config)

    # 4. Build Chromium
    ctx = BuildContext(config)
    configure_gn(ctx)
    apply_patches(ctx)

    # 5. Compile
    os.system(f"ninja -C {ctx.output_dir} chrome")

    print(f"\n✅ {config['branding']['product_fullname']} built successfully!")
    print(f"Binary location: {ctx.output_dir}/Titan")

if __name__ == '__main__':
    build_titan(sys.argv[1:])
```

---

## 🔨 Building Titan

### Step 1: Get Chromium Source

```bash
# This is a BIG download (~30GB)
# Only do this once!

cd /home/user
mkdir titan-browser
cd titan-browser

# Fetch Chromium (this takes hours!)
fetch --nohooks chromium
cd src

# Checkout specific version (matching BrowserOS)
git checkout 119.0.6045.159  # or latest stable

# Run hooks
gclient runhooks
```

### Step 2: Prepare Titan Patches

```bash
cd /home/user/Agentic_OS/packages/browseros

# Copy patches to Chromium
cp -r chromium_patches/titan/* /home/user/titan-browser/src/

# Copy wallet sources
cp -r ../../lib/wallet/dist /home/user/titan-browser/src/chrome/browser/resources/wallet/
```

### Step 3: Build Titan

```bash
cd /home/user/Agentic_OS/packages/browseros

# Run Titan build
python3 build_titan.py --arch x64 --release

# Or for development
python3 build_titan.py --arch x64 --debug
```

### Step 4: Build Output

After successful build (2-8 hours):

```
/home/user/titan-browser/src/out/Release/
├── Titan              # Titan browser executable
├── Titan.app/         # macOS app bundle
├── titan_installer.exe # Windows installer
└── resources/         # Assets and data files
```

---

## 🧪 Testing & Deployment

### Testing Checklist

**Basic Functionality**:
- [ ] Browser launches successfully
- [ ] Shows "Titan" branding (not BrowserOS)
- [ ] No chat mode UI elements visible
- [ ] Wallet button appears in toolbar
- [ ] Can navigate to websites normally

**Wallet Integration**:
- [ ] Wallet panel opens when clicking button
- [ ] Can create new wallet
- [ ] Wallet persists across restarts
- [ ] Balance checking works
- [ ] Faucet integration functional
- [ ] x402 detection works

**x402 Protocol**:
- [ ] Detects 402 Payment Required responses
- [ ] Shows payment prompt
- [ ] Can make payments
- [ ] Verifies payments on-chain
- [ ] Transaction history updates

### Package for Distribution

**macOS**:
```bash
cd /home/user/titan-browser/src
./build/mac/package_dmg.sh
# Creates: Titan-1.0.0.dmg
```

**Linux**:
```bash
cd /home/user/titan-browser/src
./build/linux/package_appimage.sh
# Creates: Titan-1.0.0.AppImage
```

**Windows**:
```powershell
cd C:\titan-browser\src
python build\windows\create_installer.py
# Creates: TitanSetup-1.0.0.exe
```

---

## 📦 Quick Start (Without Full Build)

**Don't want to wait 8 hours?** Start with the extension approach:

### Option A: Titan Extension (Quick Test)

1. Use pre-built BrowserOS
2. Load wallet extension (already working)
3. Test wallet + x402 functionality
4. Plan full browser build later

### Option B: Modified BrowserOS

1. Download BrowserOS source
2. Apply only critical Titan patches:
   - Branding strings
   - Remove chat UI
   - Keep wallet extension
3. Build (faster, partial customization)

---

## 🎯 Next Steps

1. **Plan Your Branding**:
   - Design Titan logo and icons
   - Define color scheme
   - Create brand guidelines

2. **Test with Extension First**:
   - Use current wallet extension
   - Validate x402 functionality
   - Get user feedback

3. **Prepare for Full Build**:
   - Set up build machine (powerful!)
   - Download Chromium source (weekend task)
   - Create all branding assets

4. **Execute Build**:
   - Apply Titan patches
   - Build for your platform
   - Test thoroughly
   - Package for distribution

---

## 📚 Additional Resources

- **Chromium Build Docs**: https://chromium.googlesource.com/chromium/src/+/main/docs/
- **BrowserOS Architecture**: `packages/browseros/README.md`
- **Wallet Library**: `lib/wallet/README.md`
- **x402 Protocol**: `docs/wallet/X402_GUIDE.md`

---

**Ready to build Titan Browser?** Start with the extension approach to test, then proceed to full browser build when ready! 🚀
