# Building Titan Browser from BrowserOS Repository

## Quick Answer

**YES, you can build from this repo!** ✅

But there's a catch: **You still need Chromium source code** (~30GB download, 100GB disk space).

The BrowserOS repository contains:
- ✅ **Build system** (Python scripts in `packages/browseros/build/`)
- ✅ **Patches** that modify Chromium to add BrowserOS features
- ✅ **Configuration files** for branding and features
- ❌ **NOT Chromium source code itself**

## Two Paths to Titan Browser

### Path 1: Extension (RECOMMENDED - Already Done! ✅)

**What you have:**
- `/home/user/Agentic_OS/packages/browseros/resources/files/titan_agent/`
- Complete Titan-branded extension
- Full wallet + x402 support
- Ready to use in 10 minutes

**Why this is better:**
- ✅ No Chromium download needed
- ✅ No 2-8 hour build process
- ✅ Works in any Chromium browser
- ✅ Fast iteration and testing
- ✅ Easy updates and distribution

**How to use:**
```bash
# 1. Download BrowserOS
# Visit: https://files.browseros.com/download/

# 2. Load extension
# chrome://extensions → Load unpacked
# Select: /home/user/Agentic_OS/packages/browseros/resources/files/titan_agent

# 3. Use Titan
# Press Ctrl+T to open Titan panel
# Click 💰 for wallet
```

---

### Path 2: Full Browser Build (Advanced)

If you need a completely standalone browser binary with "Titan" everywhere (app name, executables, system integration), here's how to build it using the BrowserOS build system.

## Prerequisites

### System Requirements
- **Disk Space**: 100GB+ free
- **RAM**: 16GB+ (32GB recommended)
- **CPU**: Modern multi-core (build takes 2-8 hours)
- **OS**: Linux (Ubuntu 20.04+), macOS 10.15+, or Windows 10+

### Software Requirements

1. **Chromium Source Code** (~30GB)
   ```bash
   # Install depot_tools
   git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
   export PATH="/path/to/depot_tools:$PATH"

   # Create directory for Chromium
   mkdir -p ~/chromium
   cd ~/chromium

   # Fetch Chromium source (this takes hours!)
   fetch --nohooks chromium
   cd src

   # Install dependencies
   ./build/install-build-deps.sh  # Linux
   # or follow macOS/Windows instructions

   # Run hooks
   gclient runhooks
   ```

2. **Python 3.8+**
   ```bash
   python3 --version  # Should be 3.8 or higher
   ```

3. **Build Tools**
   - Linux: `sudo apt-get install python3-pip git`
   - macOS: Xcode Command Line Tools
   - Windows: Visual Studio 2022

## Building Titan Browser

### Step 1: Prepare the BrowserOS Repository

```bash
cd /home/user/Agentic_OS/packages/browseros
```

### Step 2: Rebrand BrowserOS → Titan

You need to modify the patch files to change all "BrowserOS" references to "Titan".

#### 2.1 Update Executable Names

Edit: `chromium_patches/chrome/common/chrome_constants.cc`

Change:
```diff
-    FPL("browseros.exe");
+    FPL("titan.exe");

-const base::FilePath::CharType kBrowserProcessExecutableName[] = FPL("browseros");
+const base::FilePath::CharType kBrowserProcessExecutableName[] = FPL("titan");
```

**Quick way to update all patches:**
```bash
cd /home/user/Agentic_OS/packages/browseros/chromium_patches

# Find all files that need updating
grep -r "browseros" . --include="*.cc" --include="*.h" --include="*.mm"

# Replace BrowserOS with Titan (case-insensitive)
find . -type f \( -name "*.cc" -o -name "*.h" -o -name "*.mm" -o -name "*.gn" \) \
  -exec sed -i 's/browseros/titan/g' {} \;

find . -type f \( -name "*.cc" -o -name "*.h" -o -name "*.mm" -o -name "*.gn" \) \
  -exec sed -i 's/BrowserOS/Titan/g' {} \;

find . -type f \( -name "*.cc" -o -name "*.h" -o -name "*.mm" -o -name "*.gn" \) \
  -exec sed -i 's/BROWSEROS/TITAN/g' {} \;
```

#### 2.2 Update Build Configuration

Edit: `build/context.py` (if it exists) to change product names:
```python
# Find lines like:
PRODUCT_NAME = "BrowserOS"
# Change to:
PRODUCT_NAME = "Titan"

# Also update:
NXTSCAPE_APP_NAME = "Titan.app"  # macOS
# or
NXTSCAPE_APP_NAME = "titan.exe"  # Windows
```

#### 2.3 Remove Chat Features

The features.yaml already lists chat features. You can disable them by removing these from the patches that get applied:

Edit: `build/features.yaml`

Comment out or remove these features:
```yaml
# Chat mode features to remove:
# browseros-llm-chat:
# browseros-llm-hub:
# browseros-pin-chat-and-hub:
# browseros-updates-llm-chat-and-hub:
```

### Step 3: Create Build Configuration

Create: `build/config/titan.linux.yaml` (or titan.macos.yaml/titan.windows.yaml)

```yaml
# Titan Browser Build Configuration
build:
  type: release
  architecture: x64
  universal: false

gn_flags:
  file: build/config/gn/flags.linux.release.gn

steps:
  clean: true
  git_setup: true
  apply_patches: true
  build: true
  sign: false  # Set to true if you have signing certificates
  package: true

paths:
  root_dir: .
  chromium_src: /home/user/chromium/src  # UPDATE THIS PATH

notifications:
  slack: false
```

### Step 4: Run the Build

```bash
cd /home/user/Agentic_OS/packages/browseros/build

# Option A: Build with config file
python3 build.py --config config/titan.linux.yaml

# Option B: Build with CLI arguments
python3 build.py \
  --chromium-src ~/chromium/src \
  --arch x64 \
  --build-type release \
  --clean \
  --git-setup \
  --apply-patches \
  --build \
  --package
```

**Build process:**
1. ✅ Clean old builds (5 min)
2. ✅ Checkout Chromium version tag (10 min)
3. ✅ Apply Titan patches (5 min)
4. ✅ Configure build with GN (5 min)
5. ⏳ Compile Chromium (2-8 hours depending on CPU)
6. ✅ Package into distributable (10 min)

### Step 5: Find Your Build

After successful build:

**Linux:**
```bash
~/chromium/src/out/Default_x64/Titan
# Or packaged as:
packages/browseros/dist/<version>/Titan-<version>-x64.AppImage
```

**macOS:**
```bash
~/chromium/src/out/Default_arm64/Titan.app
# Or packaged as:
packages/browseros/dist/<version>/Titan-<version>-arm64.dmg
```

**Windows:**
```bash
~/chromium/src/out/Default_x64/titan.exe
# Or packaged as:
packages/browseros/dist/<version>/Titan-<version>-x64-Setup.exe
```

## Build System Overview

The BrowserOS build system (`packages/browseros/build/build.py`) works like this:

```
1. Load Configuration
   ↓
2. Setup Chromium Source
   - Checkout specific Chromium version tag
   - Sync dependencies with gclient
   ↓
3. Apply Patches
   - Replace Chromium files with modified versions
   - Apply string replacements (chrome → titan)
   - Copy resources (icons, extensions)
   ↓
4. Configure Build (GN)
   - Generate build files with custom flags
   - Set architecture, build type, features
   ↓
5. Build (Ninja)
   - Compile entire Chromium codebase
   - This is the longest step (hours)
   ↓
6. Sign (Optional)
   - Code sign on macOS/Windows
   - Notarize on macOS
   ↓
7. Package
   - Create DMG (macOS)
   - Create AppImage/DEB (Linux)
   - Create Installer (Windows)
   ↓
8. Done! 🎉
```

## What Gets Changed

When you build with BrowserOS patches, these things change from Chromium:

### Branding
- ✅ Executable name: `chrome` → `titan`
- ✅ App name: "Chromium" → "Titan"
- ✅ File paths: `.config/chromium` → `.config/titan`
- ✅ DLL names: `chrome.dll` → `titan.dll` (Windows)

### Features Added
- ✅ **BrowserOS API** - Custom extension API for browser control
- ✅ **Wallet integration** - Built-in crypto wallet
- ✅ **x402 support** - Payment protocol handlers
- ✅ **Auto-updater** - Sparkle framework (macOS)
- ✅ **Chrome importer** - Import from Chrome
- ✅ **Extension OTA** - Auto-update extensions
- ✅ **Metrics** - Custom telemetry (optional)
- ✅ **Settings pages** - Custom settings UI

### Features Removed (for Titan)
- ❌ Chat mode (browseros-llm-chat)
- ❌ LLM Hub (browseros-llm-hub)
- ❌ Pin chat features

## Troubleshooting

### Build Fails: "chromium_src is required"
```bash
# Make sure to specify Chromium source path:
python3 build.py --chromium-src /path/to/chromium/src --build
```

### Build Fails: "Tag not found"
```bash
# Check what Chromium version is expected
cd ~/chromium/src
git tag -l | grep "131.0"  # Find available tags

# Update the version in context.py if needed
```

### Build Fails: Compilation Errors
```bash
# Make sure you have all dependencies
cd ~/chromium/src
./build/install-build-deps.sh  # Linux
gclient sync  # Re-sync dependencies
```

### Patches Don't Apply
```bash
# The Chromium version might have changed
# You may need to update patches manually
# Check: packages/browseros/chromium_patches/
```

### Out of Disk Space
```bash
# Chromium builds are HUGE
# You need at least 100GB free
# Clean old builds:
cd ~/chromium/src
rm -rf out/
```

## Comparison: Extension vs Full Build

| Feature | Extension (Path 1) | Full Build (Path 2) |
|---------|-------------------|---------------------|
| **Setup Time** | 10 minutes | 1-2 days |
| **Disk Space** | < 100MB | 100GB+ |
| **Download Size** | None | 30GB Chromium source |
| **Build Time** | None | 2-8 hours |
| **Chromium Needed** | ❌ No | ✅ Yes |
| **Branding** | Extension only | Entire browser |
| **System Integration** | Via parent browser | Full native app |
| **Auto-updates** | Extension update | Custom updater |
| **Distribution** | Single extension folder | Platform-specific installers |
| **Wallet Support** | ✅ Full | ✅ Full |
| **x402 Support** | ✅ Full | ✅ Full |
| **Chat Mode Removed** | ✅ Yes | ✅ Yes |
| **Iteration Speed** | ⚡ Instant | 🐌 Hours per change |

## Recommendation

**For your use case, stick with Path 1 (Extension):**

✅ **You already have it**: `titan_agent/` is ready to use
✅ **Meets requirements**: Wallet + x402 + Titan branding + No chat
✅ **Fast deployment**: Share a single folder, no build needed
✅ **Easy testing**: Load in any browser instantly
✅ **Quick updates**: Edit files and reload

**Only build full browser if:**
- ❌ You need custom Chromium C++ code
- ❌ You need system-level integration
- ❌ You want to distribute as standalone app
- ❌ You have time and resources for long builds

## Next Steps

### If Using Extension (Recommended):
```bash
# 1. Test Titan extension
# Load: /home/user/Agentic_OS/packages/browseros/resources/files/titan_agent

# 2. Customize branding
# Edit: titan_agent/manifest.json
# Edit: titan_agent/wallet-panel.css (colors, styling)
# Add: Custom icons in titan_agent/assets/

# 3. Get user feedback

# 4. Iterate quickly
```

### If Building Full Browser:
```bash
# 1. Download Chromium source (~6-8 hours)
fetch --nohooks chromium

# 2. Apply Titan branding to patches (~1 hour)
# Edit: chromium_patches/**/*

# 3. Run build (~2-8 hours)
python3 build.py --config config/titan.yaml

# 4. Test the build

# 5. Repeat for each change (hours each time)
```

## Support

The BrowserOS build system is well-documented in:
- `packages/browseros/build/build.py` - Main build script
- `packages/browseros/build/modules/` - Build modules
- `packages/browseros/build/config/` - Configuration files
- `packages/browseros/build/features.yaml` - Feature toggles

For Chromium build issues, see:
- https://chromium.googlesource.com/chromium/src/+/main/docs/linux/build_instructions.md
- https://chromium.googlesource.com/chromium/src/+/main/docs/mac_build_instructions.md
- https://chromium.googlesource.com/chromium/src/+/main/docs/windows_build_instructions.md

---

**Summary**: Yes, you can build from the repo, but you still need Chromium source. The extension approach gives you 95% of what you need with 1% of the effort. Recommended: Use the Titan extension that's already built and ready! 🚀
