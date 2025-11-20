# Adding x402 Natively to BrowserOS/Titan

## YES! You Can Build on Existing BrowserOS Repo! 🎯

Instead of building from scratch or using an extension, we can **add x402 features directly into the BrowserOS codebase** using the same pattern BrowserOS uses for its native features.

## How BrowserOS Adds Native Features

BrowserOS extends Chromium by adding patches in `chromium_patches/`:

```
packages/browseros/chromium_patches/
├── chrome/common/extensions/api/
│   └── browser_os.idl              # API definition
├── chrome/browser/extensions/api/browser_os/
│   ├── browser_os_api.h            # C++ header
│   ├── browser_os_api.cc           # C++ implementation
│   └── ...helpers and processors
└── build/features.yaml             # Feature configuration
```

**We'll use this same pattern to add x402 + wallet natively!**

## Architecture: Native x402 Integration

```
┌─────────────────────────────────────────────────────────┐
│                    Titan Browser                         │
├─────────────────────────────────────────────────────────┤
│  Network Layer (Intercept HTTP 402)                     │
│    ├─ OnHeadersReceived()                               │
│    └─ Detect: X-402-Address, X-402-Amount              │
│                                                          │
│  x402 Protocol Handler (C++)                            │
│    ├─ Parse 402 response headers                        │
│    ├─ Create payment request                            │
│    └─ Trigger wallet payment flow                       │
│                                                          │
│  Wallet Core (C++)                                      │
│    ├─ HD Wallet (BIP39/32/44)                           │
│    ├─ Keychain integration (secure storage)            │
│    ├─ Web3 provider (ethers.js bridge)                  │
│    └─ Transaction signing                               │
│                                                          │
│  x402 API (JavaScript ↔ C++)                           │
│    ├─ titan.wallet.create()                             │
│    ├─ titan.wallet.getBalance()                         │
│    ├─ titan.x402.handlePayment()                        │
│    └─ titan.x402.verifyPayment()                        │
│                                                          │
│  UI Integration                                          │
│    ├─ Native payment dialog                             │
│    ├─ Settings page for wallet                          │
│    └─ Status indicators                                  │
└─────────────────────────────────────────────────────────┘
```

## Step-by-Step Implementation

### Step 1: Create x402 API Definition

**File**: `packages/browseros/chromium_patches/chrome/common/extensions/api/titan_x402.idl`

```cpp
// Titan x402 Payment Protocol API
namespace titanX402 {

  // x402 payment request information
  dictionary PaymentRequest {
    // Payment recipient address
    DOMString address;

    // Payment amount (in token units, e.g., USDC with 6 decimals)
    DOMString amount;

    // Token/Currency (e.g., "USDC", "ETH")
    DOMString currency;

    // Network (e.g., "base-sepolia", "ethereum-mainnet")
    DOMString network;

    // Invoice ID for tracking
    DOMString? invoiceId;

    // Original request URL
    DOMString url;

    // Optional metadata
    object? metadata;
  };

  // Payment response after transaction
  dictionary PaymentResponse {
    boolean success;

    // Transaction hash
    DOMString? transactionHash;

    // Error message if failed
    DOMString? error;

    // Invoice ID
    DOMString? invoiceId;
  };

  // Wallet information
  dictionary WalletInfo {
    DOMString address;
    boolean isLocked;
    DOMString network;
  };

  // Balance information
  dictionary Balance {
    DOMString eth;
    DOMString usdc;
    DOMString network;
  };

  callback PaymentCallback = void(PaymentResponse response);
  callback WalletInfoCallback = void(WalletInfo wallet);
  callback BalanceCallback = void(Balance balance);
  callback BooleanCallback = void(boolean success);

  interface Functions {
    // Wallet Management

    // Creates a new wallet with password
    static void createWallet(
        DOMString password,
        BooleanCallback callback);

    // Unlocks wallet with password
    static void unlockWallet(
        DOMString password,
        BooleanCallback callback);

    // Gets current wallet info
    static void getWalletInfo(
        WalletInfoCallback callback);

    // Gets wallet balance
    static void getBalance(
        DOMString network,
        BalanceCallback callback);

    // x402 Payment Protocol

    // Handles x402 payment request
    static void handlePayment(
        PaymentRequest request,
        PaymentCallback callback);

    // Verifies payment on-chain
    static void verifyPayment(
        DOMString transactionHash,
        DOMString invoiceId,
        BooleanCallback callback);
  };

  interface Events {
    // Fired when x402 payment is requested
    static void onPaymentRequested(PaymentRequest request);

    // Fired when payment is completed
    static void onPaymentCompleted(PaymentResponse response);

    // Fired when wallet is locked/unlocked
    static void onWalletStatusChanged(WalletInfo wallet);
  };
};
```

### Step 2: Create C++ Implementation

**File**: `packages/browseros/chromium_patches/chrome/browser/extensions/api/titan_x402/titan_x402_api.h`

```cpp
#ifndef CHROME_BROWSER_EXTENSIONS_API_TITAN_X402_TITAN_X402_API_H_
#define CHROME_BROWSER_EXTENSIONS_API_TITAN_X402_TITAN_X402_API_H_

#include "extensions/browser/extension_function.h"
#include "base/memory/weak_ptr.h"

namespace extensions {
namespace api {

// Create Wallet Function
class TitanX402CreateWalletFunction : public ExtensionFunction {
 public:
  DECLARE_EXTENSION_FUNCTION("titanX402.createWallet",
                             TITAN_X402_CREATEWALLET)

  TitanX402CreateWalletFunction() = default;

 protected:
  ~TitanX402CreateWalletFunction() override = default;
  ResponseAction Run() override;

 private:
  void OnWalletCreated(bool success);
  base::WeakPtrFactory<TitanX402CreateWalletFunction> weak_factory_{this};
};

// Unlock Wallet Function
class TitanX402UnlockWalletFunction : public ExtensionFunction {
 public:
  DECLARE_EXTENSION_FUNCTION("titanX402.unlockWallet",
                             TITAN_X402_UNLOCKWALLET)

  TitanX402UnlockWalletFunction() = default;

 protected:
  ~TitanX402UnlockWalletFunction() override = default;
  ResponseAction Run() override;
};

// Get Wallet Info Function
class TitanX402GetWalletInfoFunction : public ExtensionFunction {
 public:
  DECLARE_EXTENSION_FUNCTION("titanX402.getWalletInfo",
                             TITAN_X402_GETWALLETINFO)

  TitanX402GetWalletInfoFunction() = default;

 protected:
  ~TitanX402GetWalletInfoFunction() override = default;
  ResponseAction Run() override;
};

// Get Balance Function
class TitanX402GetBalanceFunction : public ExtensionFunction {
 public:
  DECLARE_EXTENSION_FUNCTION("titanX402.getBalance",
                             TITAN_X402_GETBALANCE)

  TitanX402GetBalanceFunction() = default;

 protected:
  ~TitanX402GetBalanceFunction() override = default;
  ResponseAction Run() override;

 private:
  void OnBalanceFetched(const std::string& eth_balance,
                       const std::string& usdc_balance);
  base::WeakPtrFactory<TitanX402GetBalanceFunction> weak_factory_{this};
};

// Handle Payment Function
class TitanX402HandlePaymentFunction : public ExtensionFunction {
 public:
  DECLARE_EXTENSION_FUNCTION("titanX402.handlePayment",
                             TITAN_X402_HANDLEPAYMENT)

  TitanX402HandlePaymentFunction() = default;

 protected:
  ~TitanX402HandlePaymentFunction() override = default;
  ResponseAction Run() override;

 private:
  void OnPaymentCompleted(bool success,
                         const std::string& tx_hash,
                         const std::string& error);
  base::WeakPtrFactory<TitanX402HandlePaymentFunction> weak_factory_{this};
};

}  // namespace api
}  // namespace extensions

#endif  // CHROME_BROWSER_EXTENSIONS_API_TITAN_X402_TITAN_X402_API_H_
```

**File**: `packages/browseros/chromium_patches/chrome/browser/extensions/api/titan_x402/titan_x402_api.cc`

```cpp
#include "chrome/browser/extensions/api/titan_x402/titan_x402_api.h"

#include "base/json/json_reader.h"
#include "base/values.h"
#include "chrome/browser/extensions/api/titan_x402/titan_wallet_manager.h"
#include "chrome/browser/profiles/profile.h"
#include "content/public/browser/browser_context.h"

namespace extensions {
namespace api {

// Create Wallet Implementation
ExtensionFunction::ResponseAction TitanX402CreateWalletFunction::Run() {
  auto params = titan_x402::CreateWallet::Params::Create(args());
  EXTENSION_FUNCTION_VALIDATE(params);

  const std::string& password = params->password;

  // Get wallet manager from profile
  Profile* profile = Profile::FromBrowserContext(browser_context());
  auto* wallet_manager = TitanWalletManager::GetForProfile(profile);

  // Create wallet asynchronously
  wallet_manager->CreateWallet(
      password,
      base::BindOnce(&TitanX402CreateWalletFunction::OnWalletCreated,
                     weak_factory_.GetWeakPtr()));

  return RespondLater();
}

void TitanX402CreateWalletFunction::OnWalletCreated(bool success) {
  Respond(WithArguments(success));
}

// Handle Payment Implementation
ExtensionFunction::ResponseAction TitanX402HandlePaymentFunction::Run() {
  auto params = titan_x402::HandlePayment::Params::Create(args());
  EXTENSION_FUNCTION_VALIDATE(params);

  const auto& request = params->request;

  Profile* profile = Profile::FromBrowserContext(browser_context());
  auto* wallet_manager = TitanWalletManager::GetForProfile(profile);

  // Process payment
  wallet_manager->SendPayment(
      request.address,
      request.amount,
      request.currency,
      request.network,
      request.invoice_id.value_or(""),
      base::BindOnce(&TitanX402HandlePaymentFunction::OnPaymentCompleted,
                     weak_factory_.GetWeakPtr()));

  return RespondLater();
}

void TitanX402HandlePaymentFunction::OnPaymentCompleted(
    bool success,
    const std::string& tx_hash,
    const std::string& error) {

  base::Value::Dict response;
  response.Set("success", success);

  if (success) {
    response.Set("transactionHash", tx_hash);
  } else {
    response.Set("error", error);
  }

  Respond(WithArguments(std::move(response)));
}

// ... other function implementations ...

}  // namespace api
}  // namespace extensions
```

### Step 3: Create Wallet Manager (C++)

**File**: `packages/browseros/chromium_patches/chrome/browser/extensions/api/titan_x402/titan_wallet_manager.h`

```cpp
#ifndef CHROME_BROWSER_EXTENSIONS_API_TITAN_X402_TITAN_WALLET_MANAGER_H_
#define CHROME_BROWSER_EXTENSIONS_API_TITAN_X402_TITAN_WALLET_MANAGER_H_

#include "base/callback.h"
#include "base/memory/weak_ptr.h"
#include "components/keyed_service/core/keyed_service.h"

class Profile;

namespace extensions {

// Manages Titan wallet functionality
class TitanWalletManager : public KeyedService {
 public:
  using BooleanCallback = base::OnceCallback<void(bool)>;
  using PaymentCallback = base::OnceCallback<void(bool,
                                                   const std::string&,
                                                   const std::string&)>;
  using BalanceCallback = base::OnceCallback<void(const std::string&,
                                                   const std::string&)>;

  explicit TitanWalletManager(Profile* profile);
  ~TitanWalletManager() override;

  // Wallet operations
  void CreateWallet(const std::string& password, BooleanCallback callback);
  void UnlockWallet(const std::string& password, BooleanCallback callback);
  void LockWallet();

  bool IsWalletCreated() const;
  bool IsWalletUnlocked() const;
  std::string GetWalletAddress() const;

  // Balance operations
  void GetBalance(const std::string& network, BalanceCallback callback);

  // Payment operations
  void SendPayment(const std::string& to_address,
                  const std::string& amount,
                  const std::string& currency,
                  const std::string& network,
                  const std::string& invoice_id,
                  PaymentCallback callback);

  // Static accessor
  static TitanWalletManager* GetForProfile(Profile* profile);

 private:
  // Keychain/keyring integration for secure storage
  void SaveEncryptedWallet(const std::string& encrypted_data);
  std::string LoadEncryptedWallet();

  // Web3 integration (could use Node.js addon or C++ web3 library)
  void ConnectToNetwork(const std::string& network);

  Profile* profile_;
  bool is_unlocked_ = false;
  std::string wallet_address_;

  base::WeakPtrFactory<TitanWalletManager> weak_factory_{this};
};

}  // namespace extensions

#endif  // CHROME_BROWSER_EXTENSIONS_API_TITAN_X402_TITAN_WALLET_MANAGER_H_
```

### Step 4: Add HTTP 402 Interceptor

**File**: `packages/browseros/chromium_patches/chrome/browser/net/titan_x402_interceptor.h`

```cpp
#ifndef CHROME_BROWSER_NET_TITAN_X402_INTERCEPTOR_H_
#define CHROME_BROWSER_NET_TITAN_X402_INTERCEPTOR_H_

#include "services/network/public/mojom/url_response_head.mojom-forward.h"
#include "services/network/public/cpp/resource_request.h"

namespace content {
class BrowserContext;
}

namespace titan {

// Intercepts HTTP 402 Payment Required responses
class X402Interceptor {
 public:
  static void InterceptResponse(
      const network::ResourceRequest& request,
      const network::mojom::URLResponseHead& response,
      content::BrowserContext* browser_context);

  // Check if response is a 402 with x402 headers
  static bool IsX402Response(const network::mojom::URLResponseHead& response);

  // Parse x402 headers into payment request
  static base::Value::Dict ParseX402Headers(
      const network::mojom::URLResponseHead& response);
};

}  // namespace titan

#endif  // CHROME_BROWSER_NET_TITAN_X402_INTERCEPTOR_H_
```

**File**: `packages/browseros/chromium_patches/chrome/browser/net/titan_x402_interceptor.cc`

```cpp
#include "chrome/browser/net/titan_x402_interceptor.h"

#include "base/strings/string_util.h"
#include "chrome/browser/extensions/api/titan_x402/titan_wallet_manager.h"
#include "chrome/browser/profiles/profile.h"
#include "content/public/browser/browser_thread.h"
#include "net/http/http_response_headers.h"

namespace titan {

void X402Interceptor::InterceptResponse(
    const network::ResourceRequest& request,
    const network::mojom::URLResponseHead& response,
    content::BrowserContext* browser_context) {

  DCHECK_CURRENTLY_ON(content::BrowserThread::UI);

  if (!IsX402Response(response)) {
    return;
  }

  // Parse x402 headers
  auto payment_request = ParseX402Headers(response);
  payment_request.Set("url", request.url.spec());

  // Get wallet manager
  Profile* profile = Profile::FromBrowserContext(browser_context);
  auto* wallet_manager = extensions::TitanWalletManager::GetForProfile(profile);

  // Show payment dialog (trigger event to extension/UI)
  // Or handle automatically based on settings
  // For now, let's trigger an event

  // Dispatch event to extensions listening for x402 payments
  // ... event dispatch code ...
}

bool X402Interceptor::IsX402Response(
    const network::mojom::URLResponseHead& response) {

  if (!response.headers) {
    return false;
  }

  // Check for 402 status code
  if (response.headers->response_code() != 402) {
    return false;
  }

  // Check for X-402-Address header
  std::string address;
  return response.headers->GetNormalizedHeader("X-402-Address", &address) &&
         !address.empty();
}

base::Value::Dict X402Interceptor::ParseX402Headers(
    const network::mojom::URLResponseHead& response) {

  base::Value::Dict payment_request;

  if (!response.headers) {
    return payment_request;
  }

  std::string value;

  if (response.headers->GetNormalizedHeader("X-402-Address", &value)) {
    payment_request.Set("address", value);
  }

  if (response.headers->GetNormalizedHeader("X-402-Amount", &value)) {
    payment_request.Set("amount", value);
  }

  if (response.headers->GetNormalizedHeader("X-402-Currency", &value)) {
    payment_request.Set("currency", value);
  }

  if (response.headers->GetNormalizedHeader("X-402-Network", &value)) {
    payment_request.Set("network", value);
  }

  if (response.headers->GetNormalizedHeader("X-402-Invoice-ID", &value)) {
    payment_request.Set("invoiceId", value);
  }

  return payment_request;
}

}  // namespace titan
```

### Step 5: Hook into Network Stack

**File**: `packages/browseros/chromium_patches/chrome/browser/chrome_content_browser_client.cc`

Find the `OnResponseStarted` or similar method and add:

```cpp
#include "chrome/browser/net/titan_x402_interceptor.h"

// In ChromeContentBrowserClient class:

void ChromeContentBrowserClient::OnResponseStarted(
    content::BrowserContext* browser_context,
    const network::ResourceRequest& request,
    const network::mojom::URLResponseHead& response) {

  // Existing code...

  // Check for x402 payment required
  titan::X402Interceptor::InterceptResponse(request, response, browser_context);
}
```

### Step 6: Add to Features Configuration

**File**: `packages/browseros/build/features.yaml`

Add new feature:

```yaml
features:
  # ... existing features ...

  titan-x402-protocol:
    description: 'Titan x402 payment protocol with native wallet'
    files:
    - chrome/common/extensions/api/titan_x402.idl
    - chrome/browser/extensions/api/titan_x402/titan_x402_api.h
    - chrome/browser/extensions/api/titan_x402/titan_x402_api.cc
    - chrome/browser/extensions/api/titan_x402/titan_wallet_manager.h
    - chrome/browser/extensions/api/titan_x402/titan_wallet_manager.cc
    - chrome/browser/net/titan_x402_interceptor.h
    - chrome/browser/net/titan_x402_interceptor.cc
    - chrome/browser/chrome_content_browser_client.cc
    - chrome/browser/extensions/BUILD.gn
    - chrome/common/extensions/api/api_sources.gni
```

### Step 7: Add BUILD.gn Files

**File**: `packages/browseros/chromium_patches/chrome/browser/extensions/api/titan_x402/BUILD.gn`

```python
source_set("titan_x402") {
  sources = [
    "titan_x402_api.cc",
    "titan_x402_api.h",
    "titan_wallet_manager.cc",
    "titan_wallet_manager.h",
  ]

  deps = [
    "//base",
    "//chrome/browser/profiles:profile",
    "//chrome/common/extensions/api",
    "//components/keyed_service/core",
    "//extensions/browser",
    "//extensions/common",
  ]
}
```

### Step 8: Create UI for Wallet

**File**: `packages/browseros/chromium_patches/chrome/browser/resources/settings/titan_wallet_page/titan_wallet_page.html`

```html
<style>
  .wallet-container {
    padding: 20px;
  }

  .wallet-address {
    font-family: monospace;
    background: #f0f0f0;
    padding: 10px;
    border-radius: 4px;
  }
</style>

<div class="wallet-container">
  <h2>Titan Wallet</h2>

  <template is="dom-if" if="[[!walletCreated]]">
    <div class="setup-wallet">
      <p>Create your Titan Wallet to enable x402 payments</p>
      <cr-input
        type="password"
        label="Password"
        value="{{password_}}"
        on-change="onPasswordChanged_">
      </cr-input>
      <cr-button on-click="onCreateWallet_">Create Wallet</cr-button>
    </div>
  </template>

  <template is="dom-if" if="[[walletCreated]]">
    <div class="wallet-info">
      <div class="wallet-address">
        <label>Address:</label>
        <div>[[walletAddress]]</div>
      </div>

      <div class="balance">
        <h3>Balance</h3>
        <div>ETH: [[ethBalance]]</div>
        <div>USDC: [[usdcBalance]]</div>
      </div>

      <cr-button on-click="onRefreshBalance_">Refresh Balance</cr-button>
    </div>
  </template>
</div>
```

### Step 9: Build the Modified Browser

```bash
cd /home/user/Agentic_OS/packages/browseros/build

# Create patches directory structure
mkdir -p chromium_patches/chrome/common/extensions/api
mkdir -p chromium_patches/chrome/browser/extensions/api/titan_x402
mkdir -p chromium_patches/chrome/browser/net

# Copy all the files above into their respective locations

# Update features.yaml (add titan-x402-protocol)

# Build Titan with x402
python3 build.py \
  --chromium-src ~/chromium/src \
  --arch x64 \
  --build-type release \
  --apply-patches \
  --build \
  --package
```

## Advantages of Native Integration

✅ **Deep Integration**
   - Intercept HTTP 402 at network layer (before page loads)
   - No extension permissions needed
   - Faster response to payment requests

✅ **Better Security**
   - Wallet keys stored in system keychain (macOS Keychain, Windows Credential Manager)
   - Native C++ security primitives
   - Sandboxed from web content

✅ **Better Performance**
   - No JavaScript overhead for crypto operations
   - Native wallet operations
   - Direct access to network stack

✅ **Better UX**
   - Native payment dialogs
   - System notifications
   - Integrated with browser settings

✅ **Automatic Updates**
   - Part of browser updates
   - No separate extension to maintain
   - Users always have latest wallet/x402

## Comparison: Extension vs Native

| Feature | Extension | Native Integration |
|---------|-----------|-------------------|
| **Development Time** | ✅ Fast (1 day) | ❌ Slow (1-2 weeks) |
| **Requires Build** | ❌ No | ✅ Yes (2-8 hours) |
| **HTTP 402 Interception** | ⚠️ webRequest API | ✅ Network stack |
| **Wallet Security** | ⚠️ Extension storage | ✅ System keychain |
| **Performance** | ⚠️ JavaScript | ✅ Native C++ |
| **Payment Dialog** | ⚠️ Extension popup | ✅ Native dialog |
| **Distribution** | ✅ Easy | ⚠️ Full installer |
| **Updates** | Extension store | Browser updates |
| **Chromium Source** | ❌ Not needed | ✅ Required (~30GB) |

## Recommended Approach

### Phase 1: Extension (NOW) ✅
- Use the Titan extension already created
- Get user feedback
- Validate the concept
- Iterate quickly

### Phase 2: Native Integration (LATER)
- Once proven, build natively
- Better security and performance
- Professional deployment
- System integration

## Next Steps

### To Build Native Version:

1. **Get Chromium source** (6-8 hours)
   ```bash
   fetch --nohooks chromium
   cd src
   gclient sync
   ```

2. **Create the patches** (1-2 days)
   - Copy all the C++ code above
   - Create the IDL files
   - Add BUILD.gn files
   - Update features.yaml

3. **Build Titan** (2-8 hours)
   ```bash
   python3 build.py --config config/titan.yaml
   ```

4. **Test thoroughly**
   - Wallet creation
   - HTTP 402 interception
   - Payment flow
   - Transaction verification

5. **Package and distribute**

### To Use Extension (Recommended Now):

```bash
# Already done! Just load it:
chrome://extensions → Load unpacked
Select: /home/user/Agentic_OS/packages/browseros/resources/files/titan_agent
```

## Summary

**YES**, you can use the existing BrowserOS repo and add x402 features natively:

1. ✅ BrowserOS has the build system
2. ✅ BrowserOS has the patch infrastructure
3. ✅ BrowserOS shows the pattern (browserOS API)
4. ✅ We can follow same pattern for x402

**BUT** you still need:
- ⏳ Chromium source code (~30GB)
- ⏳ 1-2 weeks development time
- ⏳ 2-8 hours build time per iteration

**MEANWHILE** you have:
- ✅ Working Titan extension with x402
- ✅ Ready to test now
- ✅ Fast iteration
- ✅ Same features

Start with the extension, move to native when ready! 🚀
