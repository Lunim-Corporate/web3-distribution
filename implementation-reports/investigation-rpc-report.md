# INVESTIGATION REPORT: Blockchain + RPC
**Phase:** C
**Date:** 2026-05-25
**Severity:** HIGH

---

## 1. Issue Summary

We audited the blockchain network and RPC transport layer. While the application is architecturally designed to support Base Sepolia (`chainId: 84532`), all active RPC transports in `src/app/lib/web3/wagmiConfig.ts` are blocked by the misconfigured `YOUR_ALCHEMY_KEY` placeholder string in `NEXT_PUBLIC_BASE_SEPOLIA_RPC`. Direct transport calls fail, preventing client-side smart contract reading/writing.

---

## 2. Root Cause Analysis

In [wagmiConfig.ts](file:///Users/jeeveshsingale/web3-freedom-upgrade/src/app/lib/web3/wagmiConfig.ts), the Wagmi provider instantiates RPC transports using:
```typescript
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
    [hardhat.id]: http(),
  }
```
Because `NEXT_PUBLIC_BASE_SEPOLIA_RPC` is literally set to `https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY` in `.env.local`, any attempt to read contract data (like `getContractBalance` or `release`) returns immediate standard transport connection failure.

---

## 3. Network Transport Verification

We audited the active network transport configurations:

- **Target Chain ID:** `84532` (Base Sepolia)
- **Hardhat local testing:** Supports `chainId: 31337` over standard `http('http://127.0.0.1:8545')` transport.
- **Viem Public Client:** In [web3.ts](file:///Users/jeeveshsingale/web3-freedom-upgrade/src/app/lib/web3.ts), the public client utilizes:
  ```typescript
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(ALCHEMY_RPC), // ALCHEMY_RPC maps to NEXT_PUBLIC_BASE_SEPOLIA_RPC
  });
  ```
  This client also experiences the exact same placeholder breakage.

---

## 4. Connection Gaps

1. **RPC Endpoint Call Failures:** The transport triggers standard HTTP 401 Unauthorized or DNS lookup aborts when connecting to the dummy string.
2. **Rate Limits & CORS:** Direct Alchemy connections (when configured with the valid `kcU9NMIFFiSqIueAidvdi` key) do not suffer from rate limits or CORS headers blocks, as they originate from standard secure web origins.

---

## 5. Recommended Action

1. Proceed to **Phase D** to check the smart account (ERC-4337) and sponsorship configurations.
2. Replace all instances of `YOUR_ALCHEMY_KEY` in `.env.local` during Phase F.
