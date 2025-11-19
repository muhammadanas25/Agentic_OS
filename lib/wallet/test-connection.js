/**
 * Quick network connectivity test
 */
const { WalletManager } = require('./dist/index');
const { TestnetNetwork } = require('./dist/types');

async function testConnection() {
  console.log('🔍 Testing Network Connectivity...\n');

  const walletManager = new WalletManager({ debug: false });
  const provider = walletManager.getProvider();

  // Test Base Sepolia (best for x402)
  console.log('1. Testing Base Sepolia (recommended for x402)...');
  try {
    await provider.connect(TestnetNetwork.BASE_SEPOLIA);
    const blockNumber = await provider.getProvider().getBlockNumber();
    const network = await provider.getProvider().getNetwork();
    console.log('   ✅ Connected successfully!');
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Latest block: ${blockNumber}\n`);
  } catch (error) {
    console.log('   ❌ Failed:', error.message, '\n');
  }

  // Test Sepolia with Alchemy
  console.log('2. Testing Sepolia with Alchemy API key...');
  try {
    await provider.connect(TestnetNetwork.SEPOLIA);
    const blockNumber = await provider.getProvider().getBlockNumber();
    const network = await provider.getProvider().getNetwork();
    console.log('   ✅ Connected successfully!');
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Latest block: ${blockNumber}\n`);
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    console.log('   Note: Alchemy API key may need activation\n');
  }

  console.log('✅ Network connectivity test complete!');
  console.log('\nRecommendation: Use Base Sepolia for x402 payments');
  console.log('(Fastest, cheapest, and working perfectly)\n');
}

testConnection().catch(console.error);
