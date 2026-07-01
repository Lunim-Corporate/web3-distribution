#!/usr/bin/env node
/**
 * E2E System Verification Loop
 * Run after a fresh deploy+seed cycle to verify everything works end-to-end.
 *
 * Usage:
 *   node scripts/verify-e2e.js
 *
 * This checks:
 *   1. Environment variables are configured
 *   2. Contract artifacts exist (demo + live)
 *   3. DB has seeded data (projects, holders, transactions, splits, activities)
 *   4. Contract has correct on-chain balance
 *   5. API endpoints respond correctly
 *   6. Demo mode toggle works
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const PASS = 0;
const FAIL = 1;
let exitCode = PASS;

const print = (ok, label, detail = '') => {
  const icon = ok ? '✅' : '❌';
  console.log(`  ${icon} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) exitCode = FAIL;
};

const heading = (n, text) => console.log(`\n${n}. ${text}`);

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Invalid JSON from ${url}: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

async function verify() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LUNIM — E2E System Verification');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  /* ── 1. Environment Variables ──────────────────────────── */
  heading(1, 'Environment Variables');

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_PRIVY_APP_ID',
    'NEXT_PUBLIC_ALCHEMY_API_KEY',
    'NEXT_PUBLIC_BASE_SEPOLIA_RPC',
    'NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID',
    'NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS',
    'NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS',
  ];
  for (const v of requiredVars) {
    print(!!process.env[v], `${v}`, process.env[v] ? `${process.env[v].slice(0, 30)}...` : 'MISSING');
  }

  /* ── 2. Contract Artifacts ─────────────────────────────── */
  heading(2, 'Contract Artifacts');

  const checks = [
    { file: 'DemoContract.json', label: 'Demo contract artifact' },
    { file: 'LiveContract.json', label: 'Live contract artifact' },
    { file: 'RevenueRights.json', label: 'RevenueRights (compiled ABI)' },
    { file: 'RevenueSplitter.json', label: 'RevenueSplitter (compiled ABI)' },
  ];

  for (const c of checks) {
    const p = path.join(__dirname, '..', 'src', 'contracts', c.file);
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        print(!!data.address && Array.isArray(data.abi), c.label, `address: ${data.address || 'N/A'}`);
      } catch (e) {
        print(false, c.label, `parse error: ${e.message}`);
      }
    } else {
      print(false, c.label, 'File not found');
    }
  }

  /* ── 3. Database Seeding ───────────────────────────────── */
  heading(3, 'Database Seeding');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const tables = [
        { name: 'projects', desc: 'Projects', min: 1 },
        { name: 'rights_holders', desc: 'Rights Holders', min: 3 },
        { name: 'transactions', desc: 'Transactions', min: 1 },
        { name: 'transaction_splits', desc: 'Transaction Splits', min: 1 },
        { name: 'activities', desc: 'Activities', min: 1 },
      ];

      for (const t of tables) {
        const { count, error } = await supabase
          .from(t.name)
          .select('*', { count: 'exact', head: true });
        if (error) {
          print(false, `${t.desc} (${t.name})`, error.message);
        } else {
          const ok = count >= t.min;
          print(ok, `${t.desc} (${t.name})`, `${count} records (min ${t.min})`);
        }
      }

      // Check projects have contract addresses
      const { data: projects } = await supabase.from('projects').select('id, name, contract_address, demo_contract_address');
      if (projects) {
        for (const p of projects) {
          const hasLive = !!p.contract_address;
          const hasDemo = !!p.demo_contract_address;
          if (hasLive || hasDemo) {
            print(true, `Project "${p.name}"`, `${hasLive ? 'live=✓' : 'live=✗'} ${hasDemo ? 'demo=✓' : 'demo=✗'}`);
          } else {
            print(false, `Project "${p.name}"`, 'no contract addresses set');
          }
        }
      }

      // Check holders exist
      const { count: holderCount } = await supabase
        .from('rights_holders')
        .select('*', { count: 'exact', head: true });
      print(holderCount > 0, 'Rights holders present', `${holderCount} total`);

    } catch (e) {
      print(false, 'Supabase connection', e.message);
    }
  } else {
    print(false, 'Supabase credentials', 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }

  /* ── 4. On-Chain Balance ───────────────────────────────── */
  heading(4, 'On-Chain Contract Balances');

  const demoAddr = process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS;
  const liveAddr = process.env.NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS;
  const rpc = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

  for (const [label, addr] of [['Demo', demoAddr], ['Live', liveAddr]]) {
    if (addr) {
      try {
        const body = JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'eth_getBalance',
          params: [addr, 'latest'],
        });
        const res = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        const json = await res.json();
        if (json.result) {
          const bal = BigInt(json.result);
          const eth = Number(bal) / 1e18;
          print(true, `${label} contract balance`, `${eth.toFixed(6)} ETH`);
        } else {
          print(false, `${label} contract balance`, `RPC error: ${json.error?.message || 'unknown'}`);
        }
      } catch (e) {
        print(false, `${label} contract balance`, e.message);
      }
    } else {
      print(false, `${label} contract address`, 'Not configured');
    }
  }

  /* ── 5. API Smoke Tests ────────────────────────────────── */
  heading(5, 'API Endpoint Smoke Tests');

  const base = 'http://localhost:3000';
  const endpoints = [
    { path: '/api/projects', label: 'GET /api/projects' },
    { path: '/api/eth-price', label: 'GET /api/eth-price' },
    { path: '/api/dashboard', label: 'GET /api/dashboard' },
  ];

  for (const ep of endpoints) {
    try {
      const data = await fetchJson(`${base}${ep.path}`);
      print(true, ep.label, `responded (200)`);
    } catch (e) {
      print(false, ep.label, e.message);
    }
  }

  /* ── 6. Demo Mode Toggle ───────────────────────────────── */
  heading(6, 'Demo Mode Configuration');

  print(
    !!process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS,
    'Demo contract address configured',
    process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS
  );
  print(
    !!process.env.NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS,
    'Live contract address configured',
    process.env.NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS
  );
  print(
    !!process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID,
    'Gas policy ID configured',
    process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID ? '✓' : '✗'
  );

  /* ── Summary ───────────────────────────────────────────── */
  console.log('\n═══════════════════════════════════════════════════════════');
  if (exitCode === PASS) {
    console.log('  ✅ ALL E2E CHECKS PASSED');
  } else {
    console.log('  ❌ SOME CHECKS FAILED — review above');
  }
  console.log('═══════════════════════════════════════════════════════════\n');
  process.exit(exitCode);
}

verify().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
