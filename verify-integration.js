#!/usr/bin/env node
/**
 * BrowserOS Wallet Integration Verification Script
 *
 * This script verifies that all components are working correctly
 * and provides a checklist for integration verification.
 */

const { WalletManager, TestnetNetwork } = require('./lib/wallet/dist/index');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function success(message) {
    log('✅ ' + message, 'green');
}

function error(message) {
    log('❌ ' + message, 'red');
}

function warning(message) {
    log('⚠️  ' + message, 'yellow');
}

function info(message) {
    log('ℹ️  ' + message, 'cyan');
}

function section(title) {
    console.log('\n' + '='.repeat(70));
    log(title, 'blue');
    console.log('='.repeat(70) + '\n');
}

// Verification tests
const tests = {
    async checkWalletLibrary() {
        section('1. Wallet Library Verification');

        try {
            const walletPath = path.join(__dirname, 'lib/wallet/dist/index.js');
            if (fs.existsSync(walletPath)) {
                success('Wallet library found at lib/wallet/dist/');
            } else {
                error('Wallet library not found. Run: cd lib/wallet && npm run build');
                return false;
            }

            // Check key files
            const requiredFiles = [
                'lib/wallet/dist/WalletManager.js',
                'lib/wallet/dist/X402Manager.js',
                'lib/wallet/dist/TestnetProvider.js',
                'lib/wallet/dist/TokenManager.js',
            ];

            for (const file of requiredFiles) {
                if (fs.existsSync(path.join(__dirname, file))) {
                    success(`Found: ${file}`);
                } else {
                    error(`Missing: ${file}`);
                    return false;
                }
            }

            return true;
        } catch (err) {
            error('Wallet library check failed: ' + err.message);
            return false;
        }
    },

    async checkWalletConfig() {
        section('2. Wallet Configuration Verification');

        try {
            const configPath = path.join(__dirname, 'lib/wallet/wallet-config.json');
            if (!fs.existsSync(configPath)) {
                error('Wallet config not found. Run: node lib/wallet/setup-wallet.js');
                return false;
            }

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            success('Wallet configuration found');
            info(`  Address: ${config.address}`);
            info(`  Network: ${config.network}`);

            // Check if address is valid
            if (config.address && config.address.startsWith('0x') && config.address.length === 42) {
                success('Wallet address is valid');
            } else {
                error('Invalid wallet address format');
                return false;
            }

            return true;
        } catch (err) {
            error('Config check failed: ' + err.message);
            return false;
        }
    },

    async checkNetworkConnection() {
        section('3. Network Connectivity Verification');

        try {
            const walletManager = new WalletManager({ debug: false });
            const provider = walletManager.getProvider();

            info('Testing Base Sepolia connection...');
            await provider.connect(TestnetNetwork.BASE_SEPOLIA);
            const blockNumber = await provider.getProvider().getBlockNumber();

            success(`Connected to Base Sepolia (block: ${blockNumber})`);
            return true;
        } catch (err) {
            error('Network connection failed: ' + err.message);
            warning('Check your internet connection and RPC endpoints');
            return false;
        }
    },

    async checkWalletBalance() {
        section('4. Wallet Balance Verification');

        try {
            const configPath = path.join(__dirname, 'lib/wallet/wallet-config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            const walletManager = new WalletManager({ debug: false });
            await walletManager.getProvider().connect(TestnetNetwork.BASE_SEPOLIA);

            const balance = await walletManager.getBalance(config.address);
            const balanceEth = (parseFloat(balance.toString()) / 1e18).toFixed(4);

            info(`Balance: ${balanceEth} ETH`);

            if (parseFloat(balanceEth) > 0) {
                success('Wallet has testnet ETH ✅');
            } else {
                warning('Wallet balance is 0');
                info('Get testnet tokens from: ' + config.faucetUrl);
            }

            return true;
        } catch (err) {
            error('Balance check failed: ' + err.message);
            return false;
        }
    },

    async checkUIComponents() {
        section('5. UI Components Verification');

        const uiPath = path.join(__dirname, 'packages/browseros-agent/wallet-ui-component.html');
        if (fs.existsSync(uiPath)) {
            success('Wallet UI component found');
            info('  Path: packages/browseros-agent/wallet-ui-component.html');
            info('  Open in browser to test UI');
            return true;
        } else {
            error('UI component not found');
            return false;
        }
    },

    async checkIntegrationExample() {
        section('6. Integration Example Verification');

        const examplePath = path.join(__dirname, 'wallet-integration-example.js');
        if (fs.existsSync(examplePath)) {
            success('Integration example found');
            info('  Run with: node wallet-integration-example.js');
            return true;
        } else {
            error('Integration example not found');
            return false;
        }
    },

    async checkDocumentation() {
        section('7. Documentation Verification');

        const docs = [
            'BrowserOS-Integration-Guide.md',
            'BROWSEROS-QUICK-START.md',
            'WALLET-SETUP-COMPLETE.md',
        ];

        let allFound = true;
        for (const doc of docs) {
            const docPath = path.join(__dirname, doc);
            if (fs.existsSync(docPath)) {
                success(`Found: ${doc}`);
            } else {
                error(`Missing: ${doc}`);
                allFound = false;
            }
        }

        return allFound;
    },
};

// Run all tests
async function runVerification() {
    console.log('\n');
    log('╔══════════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║                                                                      ║', 'cyan');
    log('║        🔍 BrowserOS WALLET INTEGRATION VERIFICATION                 ║', 'cyan');
    log('║                                                                      ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════════════════╝', 'cyan');

    const results = {};

    // Run all tests
    for (const [name, test] of Object.entries(tests)) {
        try {
            results[name] = await test();
        } catch (err) {
            error(`Test ${name} crashed: ${err.message}`);
            results[name] = false;
        }
    }

    // Summary
    section('📊 Verification Summary');

    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.values(results).length;
    const percentage = Math.round((passed / total) * 100);

    console.log(`Tests Passed: ${passed}/${total} (${percentage}%)\n`);

    if (percentage === 100) {
        success('🎉 ALL CHECKS PASSED! Integration is ready!');
    } else if (percentage >= 70) {
        warning('⚠️  Most checks passed, but some need attention');
    } else {
        error('❌ Several checks failed. Please review the errors above');
    }

    // Next steps
    section('🎯 Next Steps');

    if (results.checkWalletBalance !== undefined && !results.checkWalletBalance) {
        info('1. Get testnet tokens:');
        const config = JSON.parse(fs.readFileSync('lib/wallet/wallet-config.json', 'utf8'));
        info(`   ${config.faucetUrl}`);
    }

    if (percentage === 100) {
        info('1. Test the UI: open packages/browseros-agent/wallet-ui-component.html');
        info('2. Run integration example: node wallet-integration-example.js');
        info('3. Follow BrowserOS-Integration-Guide.md for full integration');
    }

    console.log('');
}

// Run verification
runVerification().catch(err => {
    error('Verification failed: ' + err.message);
    console.error(err);
    process.exit(1);
});
