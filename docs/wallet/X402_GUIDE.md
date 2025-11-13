# x402 Protocol: Agent Payments Made Simple

A complete guide to understanding and using the x402 protocol for AI agent payments.

## Table of Contents

1. [What is x402?](#what-is-x402)
2. [Why Do We Need x402?](#why-do-we-need-x402)
3. [How x402 Works](#how-x402-works)
4. [Core Concepts](#core-concepts)
5. [Payment Flow](#payment-flow)
6. [Integration Guide](#integration-guide)
7. [Use Cases](#use-cases)
8. [Best Practices](#best-practices)

---

## What is x402?

### The Simple Answer

**x402 is a protocol that lets AI agents pay each other automatically.**

Think of it like:
```
Traditional web: HTTP (for data)
Agent web:      HTTP + x402 (for data + payments)
```

### The Origin Story

The HTTP protocol has a status code **402 Payment Required**, defined in 1999 but never implemented:

```http
HTTP/1.1 402 Payment Required
```

Why wasn't it used? No good payment system existed for the internet.

**Fast forward to 2025:**
- ✅ Blockchains exist (trustless payments)
- ✅ Stablecoins exist (price stability)
- ✅ Layer 2s exist (fast & cheap)
- ✅ AI agents exist (automated consumers)

**x402 = Finally implementing HTTP 402 properly**

---

## Why Do We Need x402?

### Problem 1: Traditional Payments Don't Work for Agents

**Current system:**
```
Step 1: Sign up for API service
Step 2: Enter credit card
Step 3: Verify email
Step 4: Wait for approval
Step 5: Get API key
Step 6: Pay monthly subscription
```

**Why this fails for agents:**
- ❌ Agents can't fill out forms
- ❌ Agents don't have credit cards
- ❌ Subscription model too rigid
- ❌ Humans must intervene

### Problem 2: Micropayments Are Impossible

**Example:**
```
API call costs: $0.0001 (one hundredth of a cent)
Credit card fee: $0.30 minimum
```

**Result:** Can't charge for small services profitably.

### Problem 3: No Agent-to-Agent Marketplace

**Current:**
```
Human → API Provider
```
Only humans can buy services.

**Future:**
```
Agent A → Agent B → Agent C
```
Agents buy from and sell to each other.

### The x402 Solution

```
┌─────────────────────────────────────────┐
│         Before x402                     │
├─────────────────────────────────────────┤
│ Human signs up → Monthly subscription  │
│ API calls → Free (within quota)        │
│ Billing → End of month                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         With x402                       │
├─────────────────────────────────────────┤
│ Agent sends request + payment           │
│ API processes → Returns result          │
│ Payment → Instant (per request)         │
└─────────────────────────────────────────┘
```

---

## How x402 Works

### Architecture Overview

```
┌───────────────┐         ┌───────────────┐
│   Agent A     │         │   Agent B     │
│   (Consumer)  │         │   (Provider)  │
└───────┬───────┘         └───────┬───────┘
        │                         │
        │  1. HTTP Request        │
        │  + x402 Headers         │
        ├────────────────────────→│
        │                         │
        │  2. Payment Required    │
        │  (402 status)           │
        │←────────────────────────┤
        │                         │
        │  3. Payment via USDC    │
        │  (Base blockchain)      │
        ├────────────────────────→│
        │                         │
        │  4. Service Response    │
        │  (200 OK + data)        │
        │←────────────────────────┤
        │                         │
```

### Step-by-Step Process

#### Step 1: Agent Sends Request

```http
GET /api/analyze-image HTTP/1.1
Host: agent-b.com
X-402-Amount: 0.001
X-402-Currency: USDC
X-402-Network: base-sepolia
X-402-Wallet: 0xAgentA...
```

**What's happening:**
- Agent A wants to use Agent B's image analysis service
- Includes payment information in headers
- Specifies amount (0.001 USDC = $0.001)

#### Step 2: Provider Responds

```http
HTTP/1.1 402 Payment Required
X-402-Address: 0xAgentB...
X-402-Amount: 0.001
X-402-Network: base-sepolia
X-402-Invoice-ID: inv_abc123
```

**What's happening:**
- Agent B says "payment required"
- Provides wallet address to send payment
- Includes invoice ID for tracking

#### Step 3: Consumer Pays

```javascript
// Agent A's wallet automatically pays
await wallet.sendTransaction({
  to: '0xAgentB...',
  value: '0.001',  // USDC
  data: invoiceId   // Reference
});

// Transaction hash: 0xtxhash...
```

**What's happening:**
- Agent A sends 0.001 USDC to Agent B
- Includes invoice ID in transaction data
- Gets transaction hash as proof

#### Step 4: Provider Verifies & Serves

```http
GET /api/analyze-image HTTP/1.1
Host: agent-b.com
X-402-Payment-Proof: 0xtxhash...
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "result": "Image contains a cat",
  "confidence": 0.95
}
```

**What's happening:**
- Agent A sends original request with payment proof
- Agent B verifies payment on blockchain
- Agent B provides the service

### The Magic: All Automatic

**Key insight:** Once set up, agents handle everything:
```
Agent needs service → Checks price → Pays automatically → Gets result
```

No human intervention required!

---

## Core Concepts

### 1. Payment Headers

x402 uses HTTP headers to communicate payment info:

```http
Request Headers:
X-402-Amount: 0.001              # How much to pay
X-402-Currency: USDC             # What currency
X-402-Network: base-sepolia      # Which blockchain
X-402-Wallet: 0x123...           # Payer's address

Response Headers:
X-402-Address: 0x456...          # Where to send payment
X-402-Invoice-ID: inv_123        # Payment reference
X-402-Expiry: 1704067200         # Payment deadline
```

### 2. Status Codes

```
200 OK                 → Service provided (payment verified)
402 Payment Required   → Need payment first
403 Forbidden          → Payment verification failed
408 Request Timeout    → Payment window expired
```

### 3. Payment Tokens

**Why USDC?**

```
Native crypto (ETH):
  Price: $2000 → $1800 → $2200  (volatile)
  Problem: Can't price services reliably

Stablecoin (USDC):
  Price: $1.00 → $1.00 → $1.00  (stable)
  Solution: 1 USDC always ≈ 1 USD
```

**Token Standards:**
- ERC-20 compliant
- 6 decimals (1 USDC = 1,000,000 units)
- Verifiable on-chain

### 4. Networks

**Why Base blockchain?**

```
┌─────────┬──────────┬──────────┬──────────┐
│ Network │ Speed    │ Cost     │ x402 Fit │
├─────────┼──────────┼──────────┼──────────┤
│ Ethereum│ ~12 sec  │ $1-$50   │ ❌ Too $  │
│ Polygon │ ~2 sec   │ $0.01    │ ✅ Good   │
│ Base    │ ~2 sec   │ $0.001   │ ✅ Best   │
└─────────┴──────────┴──────────┴──────────┘
```

**Base advantages:**
- Built by Coinbase (trusted)
- Ultra-low fees (~$0.001)
- Fast finality (~2 seconds)
- EVM compatible (Ethereum tools work)

---

## Payment Flow

### Scenario: Image Analysis Service

**Setup:**
- **Agent A** - Needs image analyzed
- **Agent B** - Provides image analysis
- **Price** - $0.001 per image

### Flow Diagram

```
┌──────────────────────────────────────────────────┐
│ Step 1: Discovery                                │
│ Agent A finds Agent B's service                  │
│ Checks pricing: $0.001/image                     │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ Step 2: Initial Request                          │
│ GET /analyze HTTP/1.1                            │
│ X-402-Amount: 0.001                              │
│ X-402-Currency: USDC                             │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ Step 3: Payment Required                         │
│ HTTP 402 Payment Required                        │
│ X-402-Address: 0xAgentB...                       │
│ X-402-Invoice: inv_abc                           │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ Step 4: Agent A Pays (Blockchain Transaction)   │
│ From: 0xAgentA...                                │
│ To: 0xAgentB...                                  │
│ Amount: 0.001 USDC                               │
│ Data: inv_abc                                    │
│ ⏱️  Time: ~2 seconds                              │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ Step 5: Payment Verification                     │
│ Agent B checks blockchain                        │
│ Finds payment transaction                        │
│ Verifies amount and invoice ID                   │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ Step 6: Service Delivered                        │
│ GET /analyze + X-402-Proof: 0xtxhash             │
│ ↓                                                │
│ HTTP 200 OK + analysis result                    │
└──────────────────────────────────────────────────┘
```

### Detailed Code Example

#### Provider Side (Agent B)

```javascript
// Step 1: Receive request
app.get('/analyze', async (req, res) => {
  const amount = req.headers['x-402-amount'];
  const paymentProof = req.headers['x-402-payment-proof'];

  // If no payment proof, request payment
  if (!paymentProof) {
    return res.status(402).json({
      error: 'Payment required',
      headers: {
        'X-402-Address': agentBWallet,
        'X-402-Amount': '0.001',
        'X-402-Currency': 'USDC',
        'X-402-Invoice': generateInvoiceId()
      }
    });
  }

  // Verify payment on blockchain
  const isValid = await verifyPayment(paymentProof);
  if (!isValid) {
    return res.status(403).json({ error: 'Invalid payment' });
  }

  // Provide service
  const result = await analyzeImage(req.body.image);
  res.json({ result });
});
```

#### Consumer Side (Agent A)

```javascript
// Step 1: Make request
const response = await fetch('https://agent-b.com/analyze', {
  method: 'GET',
  headers: {
    'X-402-Amount': '0.001',
    'X-402-Currency': 'USDC',
    'X-402-Network': 'base-sepolia'
  }
});

// Step 2: Handle 402 response
if (response.status === 402) {
  const paymentInfo = await response.json();

  // Step 3: Pay
  const txHash = await wallet.sendUSDC({
    to: paymentInfo.headers['X-402-Address'],
    amount: paymentInfo.headers['X-402-Amount'],
    reference: paymentInfo.headers['X-402-Invoice']
  });

  // Step 4: Retry with proof
  const retryResponse = await fetch('https://agent-b.com/analyze', {
    method: 'GET',
    headers: {
      'X-402-Payment-Proof': txHash
    }
  });

  const result = await retryResponse.json();
  console.log('Service result:', result);
}
```

---

## Integration Guide

### For Service Providers (Earn Money)

**Goal:** Your agent provides a service and gets paid automatically.

#### Step 1: Create Agent Wallet

```javascript
import { WalletManager } from '@browseros/wallet';

const walletManager = new WalletManager();
const wallet = await walletManager.createWallet('secure-password');

console.log('Agent wallet:', wallet.address);
// Save this address - it's where you'll receive payments
```

#### Step 2: Add x402 Middleware

```javascript
import { X402Manager } from '@browseros/wallet';

const x402 = new X402Manager(walletManager);

app.use(x402.middleware({
  pricing: {
    '/analyze': '0.001',  // $0.001 per call
    '/translate': '0.0005',
    '/summarize': '0.002'
  },
  currency: 'USDC',
  network: 'base-sepolia'
}));
```

#### Step 3: Implement Service

```javascript
app.get('/analyze', async (req, res) => {
  // x402 middleware already handled payment verification
  // If we reach here, payment is confirmed

  const result = await yourAnalysisLogic(req.body);
  res.json({ result });
});
```

That's it! Your agent now earns money automatically.

### For Service Consumers (Pay for Services)

**Goal:** Your agent uses services and pays automatically.

#### Step 1: Fund Agent Wallet

```javascript
const wallet = await walletManager.createWallet('password');

// Get testnet USDC from faucet
await faucet.requestUSDC(wallet.address, 'base-sepolia');
```

#### Step 2: Make x402-Enabled Requests

```javascript
import { X402Client } from '@browseros/wallet';

const client = new X402Client(walletManager);

// Automatically handles 402 responses and payments
const result = await client.get('https://agent-b.com/analyze', {
  body: { image: imageData },
  maxPrice: '0.01'  // Won't pay more than this
});
```

#### Step 3: Monitor Spending

```javascript
const spending = await client.getSpendingReport();

console.log('Total spent:', spending.total);
console.log('By service:', spending.byService);
```

---

## Use Cases

### 1. AI API Marketplace

```
┌─────────────────────────────────────┐
│ Traditional AI APIs                 │
├─────────────────────────────────────┤
│ OpenAI: $20/month subscription      │
│ Anthropic: Pay per million tokens   │
│ Google: Free tier + enterprise      │
│                                     │
│ Problem: Fixed pricing, human setup│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ x402 AI Marketplace                 │
├─────────────────────────────────────┤
│ Agent discovers services            │
│ Agent pays per request              │
│ Agent switches providers            │
│                                     │
│ Benefit: Dynamic pricing, automated │
└─────────────────────────────────────┘
```

**Example:**
```javascript
// Agent automatically shops for best price
const providers = await discover('image-analysis');

const cheapest = providers.sort((a, b) =>
  a.price - b.price
)[0];

await x402Client.get(cheapest.url);
```

### 2. Data Purchasing

**Scenario:** Agent needs real-time weather data

```javascript
// Weather API charges per request
const weather = await x402Client.get(
  'https://weather-agent.com/current',
  {
    params: { city: 'San Francisco' },
    maxPrice: '0.0001'  // 1/100th of a cent
  }
);

// Payment happened automatically
console.log(weather.temperature);
```

### 3. Computational Resources

**Scenario:** Agent needs GPU for image processing

```javascript
// Rent GPU by the second
const gpuAgent = new X402Client(walletManager);

const result = await gpuAgent.post(
  'https://gpu-marketplace.com/process',
  {
    image: largeImage,
    model: 'stable-diffusion',
    // Pays $0.01/second automatically
  }
);
```

### 4. Agent-to-Agent Commerce

**Scenario:** Research agent hires specialized agents

```javascript
// Main research agent
class ResearchAgent {
  async analyzeMarket(topic) {
    // Hire data collection agent
    const data = await x402.get(
      'https://data-agent.com/collect',
      { topic }
    );

    // Hire analysis agent
    const analysis = await x402.get(
      'https://analysis-agent.com/analyze',
      { data }
    );

    // Hire visualization agent
    const chart = await x402.get(
      'https://viz-agent.com/chart',
      { analysis }
    );

    return { analysis, chart };
  }
}

// All payments handled automatically!
```

### 5. Content Creation Pipeline

```
Content Agent:
  ↓ (pays $0.01)
Image Generation Agent:
  ↓ (pays $0.005)
Storage Agent (IPFS):
  ↓ (pays $0.001)
NFT Minting Agent:
  ↓ (pays $0.02)
Marketplace Agent:
  ↓ (sells for $1.00)

Total cost: $0.036
Revenue: $1.00
Profit: $0.964
```

All automatic, no human intervention!

---

## Best Practices

### 1. Pricing Strategy

**Too Expensive:**
```
Service: $1.00 per request
Result: No one uses it
```

**Too Cheap:**
```
Service: $0.0000001 per request
Result: Can't cover infrastructure costs
```

**Right Balance:**
```
Calculate:
  Infrastructure cost per request: $0.0005
  Profit margin: 2x
  Price: $0.001 per request

Monitor:
  Usage rate
  Competitor pricing
  Adjust dynamically
```

### 2. Payment Verification

**Bad:**
```javascript
// Trust the client
if (req.headers['x-402-paid'] === 'true') {
  // Provide service
}
```

**Good:**
```javascript
// Verify on blockchain
const txHash = req.headers['x-402-payment-proof'];
const tx = await blockchain.getTransaction(txHash);

if (tx && tx.to === myWallet && tx.value >= price) {
  // Provide service
}
```

### 3. Error Handling

```javascript
try {
  const result = await x402Client.get(url);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    await faucet.requestUSDC(wallet.address);
    // Retry
  } else if (error.code === 'PAYMENT_EXPIRED') {
    // Payment took too long, try again
  } else if (error.code === 'SERVICE_UNAVAILABLE') {
    // Find alternative provider
  }
}
```

### 4. Rate Limiting

**Prevent abuse:**
```javascript
// Limit requests per wallet
const rateLimit = new Map();

app.use((req, res, next) => {
  const wallet = req.headers['x-402-wallet'];
  const requests = rateLimit.get(wallet) || 0;

  if (requests > 100) {  // Max 100/hour
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  rateLimit.set(wallet, requests + 1);
  next();
});
```

### 5. Monitoring

```javascript
// Track earnings
class EarningsMonitor {
  async logPayment(payment) {
    await db.insert({
      timestamp: Date.now(),
      from: payment.from,
      amount: payment.amount,
      service: payment.service,
      txHash: payment.txHash
    });
  }

  async getReport(period) {
    return {
      totalEarned: await this.getTotalEarnings(period),
      byService: await this.getEarningsByService(period),
      topCustomers: await this.getTopCustomers(period)
    };
  }
}
```

---

## Advanced Topics

### Payment Streaming

**Instead of pay-per-request, stream payments:**

```javascript
// Pay $0.01/second for continuous service
const stream = await x402.createPaymentStream({
  to: 'https://streaming-service.com',
  rate: '0.01',  // per second
  duration: 3600  // 1 hour max
});

// Service provides real-time data
stream.on('data', (chunk) => {
  process(chunk);
});

// Payment stops when done
stream.end();
```

### Conditional Payments

**Pay only if conditions are met:**

```javascript
// Smart contract escrow
const payment = await x402.createConditional({
  amount: '1.0',
  condition: 'image contains cat',
  provider: 'analysis-agent.com',
  verifier: 'verification-agent.com'
});

// Funds released only if verification passes
```

### Reputation System

**Track provider quality:**

```javascript
class ReputationTracker {
  async rateProvider(url, rating) {
    await db.insert({ url, rating, timestamp: Date.now() });
  }

  async getBestProvider(service) {
    const providers = await discover(service);

    return providers.sort((a, b) => {
      const aRating = await this.getAvgRating(a.url);
      const bRating = await this.getAvgRating(b.url);
      return bRating - aRating;
    })[0];
  }
}
```

---

## Troubleshooting

### Payment Not Detected

**Problem:** Provider doesn't see your payment

**Solutions:**
1. Check transaction on block explorer
2. Verify correct network (testnet vs mainnet)
3. Ensure enough confirmations (wait 2-3 blocks)
4. Check invoice ID matches

### Insufficient Funds

**Problem:** Agent wallet empty

**Solutions:**
```javascript
// Check balance before request
const balance = await wallet.getUSDCBalance();
if (balance < price) {
  await faucet.requestUSDC(wallet.address);
}

// Or set up auto-refill
wallet.enableAutoRefill({
  threshold: '1.0',  // Refill when below 1 USDC
  amount: '10.0'     // Top up to 10 USDC
});
```

### High Gas Fees

**Problem:** Transaction costs more than service

**Solutions:**
```javascript
// Use Layer 2 (Base is cheapest)
const x402 = new X402Manager({
  network: 'base-sepolia',  // ~$0.001 gas
  // not 'ethereum'          // ~$1-50 gas
});

// Batch payments
await x402.batchPay([
  { to: 'agent-1', amount: '0.001' },
  { to: 'agent-2', amount: '0.002' },
  { to: 'agent-3', amount: '0.001' }
]);
// One transaction instead of three
```

---

## Quick Reference

### HTTP Status Codes

```
200 OK              → Payment verified, service provided
402 Payment Req'd   → Send payment first
403 Forbidden       → Payment invalid
408 Timeout         → Payment window expired
429 Too Many Req's  → Rate limit exceeded
503 Unavailable     → Service temporarily down
```

### Headers

```
Request:
  X-402-Amount          → How much to pay
  X-402-Currency        → USDC
  X-402-Network         → base-sepolia
  X-402-Wallet          → Payer address
  X-402-Payment-Proof   → Transaction hash

Response:
  X-402-Address         → Provider wallet
  X-402-Invoice         → Payment reference
  X-402-Expiry          → Payment deadline
  X-402-Amount          → Required amount
```

### Typical Prices

```
Micro-services:
  Text analysis:    $0.0001
  Translation:      $0.0005
  Summarization:    $0.001

Medium services:
  Image generation: $0.01
  Video processing: $0.10
  AI training:      $1.00

Large services:
  Compute hours:    $10/hour
  Data storage:     $1/GB/month
  CDN bandwidth:    $0.10/GB
```

---

## Next Steps

Ready to integrate x402? Check out:

1. **[Implementation Guide](./X402_IMPLEMENTATION.md)** - Build x402 support
2. **[Wallet README](./README.md)** - Use our wallet library
3. **[Example Code](../lib/wallet/examples/x402/)** - Working examples
4. **[API Reference](./API_REFERENCE.md)** - Full API docs

---

**Questions?** Join our [Discord](https://discord.gg/browseros) or [open an issue](https://github.com/anthropics/Agentic_OS/issues).

**Building something cool with x402?** Share it with the community! 🚀
