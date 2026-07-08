#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const BASE = 'http://localhost:3000';
const DEMO_USER = { id: 'demo-admin-id', email: 'demo@lunim.io', name: 'Demo Admin', isAdmin: true, role: 'admin', isDemo: true };
const COOKIE = `crt_user=${encodeURIComponent(JSON.stringify(DEMO_USER))}`;

let passed = 0, failed = 0;
const results = [];

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json', Cookie: COOKIE } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let data; try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

function pass(name, detail) { passed++; results.push({ ok: true, name, detail }); console.log(`  ✅ ${name}: ${detail}`); }
function fail(name, detail) { failed++; results.push({ ok: false, name, detail }); console.error(`  ❌ ${name}: ${detail}`); }
const wait = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('\n══════════════════════════════════════════');
  console.log('  LUNIM — PM API Verification Suite v3');
  console.log('══════════════════════════════════════════\n');

  // [1] Dashboard
  console.log('📊 [1] Dashboard API');
  { const r = await req('GET', '/api/dashboard?pid=all&demo=true');
    if (r.status===200 && Array.isArray(r.data.projectsList)) pass('GET /api/dashboard', `${r.data.projectsList.length} projects returned`);
    else fail('GET /api/dashboard', `HTTP ${r.status}: ${JSON.stringify(r.data).substring(0,80)}`); }

  // [2] Revenue
  console.log('\n💰 [2] Revenue API');
  { const r = await req('GET', '/api/revenue?demo=true');
    if (r.status===200) pass('GET /api/revenue', 'Revenue data OK');
    else fail('GET /api/revenue', `HTTP ${r.status}`); }

  // [3] Activities
  console.log('\n📋 [3] Activities API');
  { const r = await req('GET', `/api/activities?ts=${Date.now()}&demo=true`);
    if (r.status===200 && Array.isArray(r.data)) pass('GET /api/activities', `${r.data.length} activities loaded`);
    else fail('GET /api/activities', `HTTP ${r.status}`); }

  // [4] ETH Price
  console.log('\n⛓️  [4] ETH Price API');
  { const r = await req('GET', '/api/eth-price');
    if (r.status===200 && r.data.price) pass('GET /api/eth-price', `ETH = $${r.data.price}`);
    else fail('GET /api/eth-price', `HTTP ${r.status}: ${JSON.stringify(r.data)}`); }

  // [5] Projects List
  console.log('\n📁 [5] Projects List API');
  { const r = await req('GET', '/api/projects?demo=true');
    if (r.status===200) pass('GET /api/projects', 'Projects list OK');
    else fail('GET /api/projects', `HTTP ${r.status}`); }

  // [6] Create Project
  console.log('\n🏗️  [6] Create Project');
  let pid = null;
  { const r = await req('POST', '/api/projects/add', { name: 'PM Final Verify', genre: 'Feature Film' });
    if (r.status===200||r.status===201) { pid=r.data.id; pass('POST /api/projects/add', `Created → id=${pid}`); }
    else fail('POST /api/projects/add', `HTTP ${r.status}: ${JSON.stringify(r.data)}`); }

  if (pid) {
    // [7] Edit Project
    console.log('\n✏️  [7] Edit Project');
    { const r = await req('PATCH', `/api/projects/${pid}`, { name: 'PM Final Verify (Edited)', genre: 'Documentary' });
      if (r.status===200) pass('PATCH /api/projects/:id', 'Name & genre updated');
      else fail('PATCH /api/projects/:id', `HTTP ${r.status}: ${JSON.stringify(r.data)}`); }

    // [8] Add 3 Rights Holders
    console.log('\n👥 [8] Add Rights Holders (Alice 50%, Bob 30%, Carol 20%)');
    let h1=null, h2=null, h3=null;
    for (const [h, setter] of [
      [{ full_name:'Alice Producer', role:'Producer', wallet_address:'0x70997970C51812dc3A010C7d01b50e0d17dc79C8', percentage:50 }, v=>h1=v],
      [{ full_name:'Bob Director',   role:'Director', wallet_address:'0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', percentage:30 }, v=>h2=v],
      [{ full_name:'Carol Composer', role:'Composer', wallet_address:'0x90F79bf6EB2c4f870365E785982E1f101E93b906', percentage:20 }, v=>h3=v],
    ]) {
      await wait(1500);
      const r = await req('POST', '/api/rights/add', { project_id: pid, ...h });
      if (r.status===200||r.status===201) {
        const holderData = r.data.data || r.data;
        setter(holderData.id);
        pass(`Add ${h.full_name}`, `${h.percentage}% → id=${holderData.id}`);
      } else {
        fail(`Add ${h.full_name}`, `HTTP ${r.status}: ${JSON.stringify(r.data)}`);
      }
    }

    // [9] Edit Rights Holder (via POST with action:update)
    console.log('\n✏️  [9] Edit Rights Holder (action: update)');
    if (h1) {
      const r = await req('POST', '/api/rights/manage', {
        action: 'update', id: h1,
        full_name: 'Alice Executive Producer', role: 'Executive Producer',
        wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', percentage: 50
      });
      if (r.status===200) pass('POST /api/rights/manage (update)', 'Alice → Executive Producer');
      else fail('POST /api/rights/manage (update)', `HTTP ${r.status}: ${JSON.stringify(r.data)}`);
    } else {
      fail('Edit holder', 'Skipped: h1 id not captured');
    }

    // [10] Verify Roster at 100%
    console.log('\n📋 [10] Verify Roster at 100%');
    { await wait(500);
      const r = await req('GET', `/api/dashboard?pid=${pid}&demo=true`);
      if (r.status===200) {
        const h = r.data.holders || [];
        const total = h.reduce((s,x)=>s+Number(x.percentage||0),0);
        if (Math.abs(total-100)<0.01) pass('Roster total = 100%', h.map(x=>`${x.full_name}(${x.percentage}%)`).join(', '));
        else fail('Roster total', `Expected 100%, got ${total}%`);
      } else fail('Roster verification', `HTTP ${r.status}`); }

    // [11] ETL Reconcile
    console.log('\n🔄 [11] ETL Reconcile');
    { const r = await req('GET', '/api/etl/reconcile?demo=true');
      if (r.status===200) pass('GET /api/etl/reconcile', 'Ledger reconciled OK');
      else fail('GET /api/etl/reconcile', `HTTP ${r.status}`); }

    // [12] Delete Rights Holder (Carol) via POST with action:delete
    console.log('\n🗑️  [12] Delete Rights Holder (Carol, action: delete)');
    if (h3) {
      await wait(1500);
      const r = await req('POST', '/api/rights/manage', { action: 'delete', id: h3 });
      if (r.status===200) pass('POST /api/rights/manage (delete Carol)', 'Deleted successfully');
      else fail('POST /api/rights/manage (delete Carol)', `HTTP ${r.status}: ${JSON.stringify(r.data)}`);

      await wait(500);
      const r2 = await req('GET', `/api/dashboard?pid=${pid}&demo=true`);
      const after = r2.data?.holders || [];
      if (!after.some(h=>h.full_name==='Carol Composer'))
        pass('Verify Carol removed', `Remaining: ${after.map(x=>x.full_name).join(', ')}`);
      else
        fail('Carol still in roster', 'Delete did not take effect');
    } else {
      fail('Delete Carol', 'Skipped: h3 id not captured');
    }
  }

  // [13] Reports API (with required date params)
  console.log('\n📄 [13] Reports API (with date range)');
  { const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    const r = await req('GET', `/api/reports?startDate=${start}&endDate=${end}&demo=true`);
    if (r.status===200) pass('GET /api/reports', `Report generated ${start} → ${end}`);
    else fail('GET /api/reports', `HTTP ${r.status}: ${JSON.stringify(r.data).substring(0,80)}`); }

  // [14] Admin Users
  console.log('\n👤 [14] Admin Users API');
  { const r = await req('GET', '/api/admin/users');
    if (r.status===200) { const u=Array.isArray(r.data)?r.data:r.data.users||[];
      pass('GET /api/admin/users', `${u.length} users in system`); }
    else fail('GET /api/admin/users', `HTTP ${r.status}`); }

  // [15] Milestones
  console.log('\n🏆 [15] Milestones API');
  { const r = await req('GET', '/api/milestones?demo=true');
    if (r.status===200) pass('GET /api/milestones', 'Milestones OK');
    else fail('GET /api/milestones', `HTTP ${r.status}`); }

  // [16] Diagnostics
  console.log('\n🔬 [16] Diagnostics API');
  { const r = await req('GET', '/api/diagnostics');
    if (r.status===200) pass('GET /api/diagnostics', 'System health check passed');
    else fail('GET /api/diagnostics', `HTTP ${r.status}`); }

  // Summary
  console.log('\n══════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed  |  ${failed} failed`);
  console.log('══════════════════════════════════════════');
  if (failed === 0) {
    console.log('\n🎉 ALL CHECKS PASSED — LUNIM is fully functional!\n');
  } else {
    console.log('\n⚠️  Failures:\n');
    results.filter(r=>!r.ok).forEach(r=>console.log(`   ❌ ${r.name}: ${r.detail}`));
    process.exit(1);
  }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
