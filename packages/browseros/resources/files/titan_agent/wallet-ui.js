/**
 * Titan Wallet UI Controller
 * Manages wallet UI interactions in the side panel
 */

(function() {
  'use strict';

  console.log('[Wallet UI] Initializing...');

  // Wait for wallet library to load
  if (typeof BrowserOSWallet === 'undefined') {
    console.error('[Wallet UI] BrowserOSWallet library not found!');
    return;
  }

  const { WalletManager, X402Manager, TestnetNetwork } = BrowserOSWallet;

  class WalletUI {
    constructor() {
      this.walletManager = null;
      this.x402Manager = null;
      this.currentWallet = null;
      this.isVisible = false;

      this.init();
    }

    async init() {
      console.log('[Wallet UI] Starting initialization');

      // Create wallet manager
      try {
        this.walletManager = new WalletManager({ debug: true });
        console.log('[Wallet UI] WalletManager created');

        // Try to load existing wallet
        await this.loadWallet();

        // Set up UI
        this.setupUI();
        this.setupEventListeners();

        console.log('[Wallet UI] Initialization complete');
      } catch (error) {
        console.error('[Wallet UI] Initialization failed:', error);
      }
    }

    async loadWallet() {
      try {
        const wallets = await this.walletManager.getWallets();
        if (wallets && wallets.length > 0) {
          this.currentWallet = wallets[0];
          console.log('[Wallet UI] Loaded existing wallet:', this.currentWallet.address);
          return true;
        }
      } catch (error) {
        console.error('[Wallet UI] Failed to load wallet:', error);
      }
      return false;
    }

    setupUI() {
      const container = document.getElementById('wallet-panel-container');
      if (!container) {
        console.error('[Wallet UI] Container not found');
        return;
      }

      // Inject wallet panel HTML
      container.innerHTML = `
        <div id="wallet-panel" class="wallet-panel" style="display:none;">
          <div class="wallet-header">
            <h2>🔐 Titan Wallet</h2>
            <button id="wallet-close-btn" class="icon-btn">✕</button>
          </div>

          <div id="wallet-content" class="wallet-content">
            ${this.currentWallet ? this.getDashboardHTML() : this.getSetupHTML()}
          </div>
        </div>
      `;

      console.log('[Wallet UI] UI injected');
    }

    getSetupHTML() {
      return `
        <div id="wallet-setup" class="wallet-section">
          <div class="setup-content">
            <h3>Create Your Wallet</h3>
            <p>Set up a wallet to enable x402 payments for AI agents</p>

            <div class="form-group">
              <label for="wallet-password">Password</label>
              <input
                type="password"
                id="wallet-password"
                class="wallet-input"
                placeholder="Enter a strong password"
              />
            </div>

            <button id="create-wallet-btn" class="primary-btn">
              Create Wallet
            </button>

            <div class="info-box">
              <strong>⚠️ Important:</strong> Save your password securely. You cannot recover it if lost!
            </div>
          </div>
        </div>
      `;
    }

    getDashboardHTML() {
      return `
        <div id="wallet-dashboard" class="wallet-section">
          <div class="wallet-balance">
            <div class="balance-label">Balance</div>
            <div id="eth-balance" class="balance-amount">Loading...</div>
            <div id="usdc-balance" class="balance-amount-small">Loading...</div>
          </div>

          <div class="wallet-address">
            <label>Your Address</label>
            <div class="address-container">
              <div id="wallet-address-text" class="address-text">
                ${this.currentWallet ? this.formatAddress(this.currentWallet.address) : ''}
              </div>
              <button id="copy-address-btn" class="icon-btn" title="Copy address">
                📋
              </button>
            </div>
          </div>

          <div class="network-info">
            <span class="network-badge">
              <span class="status-dot"></span>
              <span id="network-name">Base Sepolia</span>
            </span>
          </div>

          <div class="wallet-actions">
            <button id="refresh-btn" class="action-btn">
              <span>🔄</span>
              <span>Refresh</span>
            </button>
            <button id="faucet-btn" class="action-btn">
              <span>💧</span>
              <span>Faucet</span>
            </button>
            <button id="x402-btn" class="action-btn">
              <span>💸</span>
              <span>x402</span>
            </button>
          </div>

          <div class="payment-history">
            <h4>Recent Activity</h4>
            <div id="payment-list" class="payment-list">
              <div class="empty-state">No transactions yet</div>
            </div>
          </div>
        </div>
      `;
    }

    setupEventListeners() {
      // Toggle wallet panel
      const toggleBtn = document.getElementById('wallet-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggleWallet());
      }

      // Close wallet panel
      document.addEventListener('click', (e) => {
        if (e.target.id === 'wallet-close-btn') {
          this.hideWallet();
        }
      });

      // Create wallet button
      document.addEventListener('click', async (e) => {
        if (e.target.id === 'create-wallet-btn') {
          await this.handleCreateWallet();
        }
      });

      // Copy address button
      document.addEventListener('click', (e) => {
        if (e.target.id === 'copy-address-btn' || e.target.parentElement?.id === 'copy-address-btn') {
          this.copyAddress();
        }
      });

      // Refresh button
      document.addEventListener('click', async (e) => {
        if (e.target.id === 'refresh-btn' || e.target.parentElement?.id === 'refresh-btn') {
          await this.refreshBalances();
        }
      });

      // Faucet button
      document.addEventListener('click', async (e) => {
        if (e.target.id === 'faucet-btn' || e.target.parentElement?.id === 'faucet-btn') {
          await this.requestFaucet();
        }
      });

      // x402 button
      document.addEventListener('click', (e) => {
        if (e.target.id === 'x402-btn' || e.target.parentElement?.id === 'x402-btn') {
          this.showX402Info();
        }
      });

      console.log('[Wallet UI] Event listeners attached');
    }

    toggleWallet() {
      if (this.isVisible) {
        this.hideWallet();
      } else {
        this.showWallet();
      }
    }

    showWallet() {
      const panel = document.getElementById('wallet-panel');
      const toggleBtn = document.getElementById('wallet-toggle');

      if (panel) {
        panel.style.display = 'flex';
        this.isVisible = true;

        if (toggleBtn) {
          toggleBtn.classList.add('active');
        }

        // Load balances if wallet exists
        if (this.currentWallet) {
          this.refreshBalances();
        }
      }
    }

    hideWallet() {
      const panel = document.getElementById('wallet-panel');
      const toggleBtn = document.getElementById('wallet-toggle');

      if (panel) {
        panel.style.display = 'none';
        this.isVisible = false;

        if (toggleBtn) {
          toggleBtn.classList.remove('active');
        }
      }
    }

    async handleCreateWallet() {
      const passwordInput = document.getElementById('wallet-password');
      const createBtn = document.getElementById('create-wallet-btn');

      if (!passwordInput) return;

      const password = passwordInput.value.trim();

      if (!password || password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
      }

      try {
        createBtn.disabled = true;
        createBtn.textContent = 'Creating...';

        const wallet = await this.walletManager.createWallet(password);
        this.currentWallet = wallet;

        console.log('[Wallet UI] Wallet created:', wallet.address);

        // Show success message
        alert(`Wallet created successfully!\\n\\nAddress: ${wallet.address}\\n\\nSave this address and password securely!`);

        // Refresh UI
        document.getElementById('wallet-content').innerHTML = this.getDashboardHTML();

        // Connect to network
        await this.connectToNetwork();

      } catch (error) {
        console.error('[Wallet UI] Failed to create wallet:', error);
        alert('Failed to create wallet: ' + error.message);
        createBtn.disabled = false;
        createBtn.textContent = 'Create Wallet';
      }
    }

    async connectToNetwork() {
      try {
        await this.walletManager.getProvider().connect(TestnetNetwork.BASE_SEPOLIA);
        console.log('[Wallet UI] Connected to Base Sepolia');
        await this.refreshBalances();
      } catch (error) {
        console.error('[Wallet UI] Network connection failed:', error);
      }
    }

    async refreshBalances() {
      if (!this.currentWallet) return;

      const ethBalanceEl = document.getElementById('eth-balance');
      const usdcBalanceEl = document.getElementById('usdc-balance');

      if (ethBalanceEl) ethBalanceEl.textContent = 'Loading...';
      if (usdcBalanceEl) usdcBalanceEl.textContent = 'Loading...';

      try {
        // Connect if not connected
        if (!this.walletManager.getProvider().isConnected()) {
          await this.connectToNetwork();
        }

        // Get ETH balance
        const ethBalance = await this.walletManager.getBalance(
          this.currentWallet.address,
          TestnetNetwork.BASE_SEPOLIA
        );

        if (ethBalanceEl) {
          ethBalanceEl.textContent = `${parseFloat(ethBalance).toFixed(4)} ETH`;
        }

        // Get USDC balance
        // Note: This requires TokenManager which may need network connection
        if (usdcBalanceEl) {
          usdcBalanceEl.textContent = '0 USDC';
        }

        console.log('[Wallet UI] Balances updated');
      } catch (error) {
        console.error('[Wallet UI] Failed to refresh balances:', error);
        if (ethBalanceEl) ethBalanceEl.textContent = 'Error loading balance';
        if (usdcBalanceEl) usdcBalanceEl.textContent = '';
      }
    }

    async requestFaucet() {
      if (!this.currentWallet) return;

      try {
        const faucetUrl = `https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet?address=${this.currentWallet.address}`;

        // Open faucet URL in new tab
        chrome.tabs.create({ url: faucetUrl });

        alert('Faucet page opened! Request testnet ETH from Coinbase faucet.\\n\\nTokens should arrive in a few minutes.');

        // Refresh balances after delay
        setTimeout(() => this.refreshBalances(), 5000);
      } catch (error) {
        console.error('[Wallet UI] Faucet request failed:', error);
        alert('Failed to open faucet: ' + error.message);
      }
    }

    copyAddress() {
      if (!this.currentWallet) return;

      navigator.clipboard.writeText(this.currentWallet.address)
        .then(() => {
          const btn = document.getElementById('copy-address-btn');
          if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓';
            btn.style.color = '#10b981';
            setTimeout(() => {
              btn.innerHTML = originalText;
              btn.style.color = '';
            }, 2000);
          }
        })
        .catch(err => {
          console.error('[Wallet UI] Copy failed:', err);
        });
    }

    showX402Info() {
      alert(`x402 Payment Protocol

Your wallet is ready to make and receive x402 payments!

Address: ${this.currentWallet?.address || 'No wallet'}

To use x402:
• AI agents can request payments for services
• Payments happen automatically with your approval
• All transactions are on Base Sepolia testnet

Learn more in the documentation.`);
    }

    formatAddress(address) {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
  }

  // Initialize wallet UI when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new WalletUI();
    });
  } else {
    new WalletUI();
  }

  console.log('[Wallet UI] Script loaded');
})();

// Titan Browser Welcome
console.log('%c🚀 Titan Browser', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log('%cEnhanced AI Browser with Crypto Wallet & x402 Payments', 'font-size: 12px; color: #999;');
console.log('%cVersion 1.0.0', 'font-size: 10px; color: #666;');
