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
