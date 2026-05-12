/**
 * Analytics Routes — PRD §12 (Analytics Routes)
 * GET /api/analytics/overview — admin only
 * GET /api/analytics/project/:id — scoped by role
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const verifyJWT = require('../middleware/verifyJWT');
const requireRole = require('../middleware/requireRole');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/analytics/overview — PRD §12 (Admin only)
router.get('/overview', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    // Total distributed across all projects
    const { data: projects } = await supabase.from('projects').select('id, name, genre, status, total_distributed');
    const totalDistributed = (projects || []).reduce((sum, p) => sum + Number(p.total_distributed || 0), 0);

    // Pending transactions
    const { data: pendingTxs } = await supabase.from('transactions').select('total_amount_eth').eq('status', 'pending');
    const pendingAmount = (pendingTxs || []).reduce((sum, t) => sum + Number(t.total_amount_eth || 0), 0);

    // Active contributors
    const { data: holders } = await supabase.from('rights_holders').select('id, full_name, role, wallet_address, percentage, total_received, project_id, status');
    const activeContributors = (holders || []).filter(h => h.status === 'ACTIVE').length;

    // Revenue by month (last 12 months)
    const { data: confirmedTxs } = await supabase
      .from('transactions')
      .select('total_amount_eth, confirmed_at, status')
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: true });

    const now = new Date();
    const revenueByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthTxs = (confirmedTxs || []).filter(t => {
        if (!t.confirmed_at) return false;
        const txDate = new Date(t.confirmed_at);
        return txDate.getFullYear() === d.getFullYear() && txDate.getMonth() === d.getMonth();
      });
      revenueByMonth.push({
        month: monthKey,
        distributed: monthTxs.reduce((s, t) => s + Number(t.total_amount_eth || 0), 0),
      });
    }

    // Revenue by role category
    const roleCategories = {};
    (holders || []).forEach(h => {
      const cat = h.role || 'Other';
      if (!roleCategories[cat]) roleCategories[cat] = 0;
      roleCategories[cat] += Number(h.total_received || 0);
    });
    const revenueByRole = Object.entries(roleCategories).map(([role, amount]) => ({ role, amount }));

    // Top holders
    const topHolders = (holders || [])
      .sort((a, b) => Number(b.total_received || 0) - Number(a.total_received || 0))
      .slice(0, 10)
      .map((h, i) => ({
        rank: i + 1,
        name: h.full_name,
        role: h.role,
        projectId: h.project_id,
        totalReceived: Number(h.total_received || 0),
        percentage: Number(h.percentage || 0),
      }));

    // Recent activity (last 20 transactions)
    const { data: recentTxs } = await supabase
      .from('transactions')
      .select('*, projects(name)')
      .order('created_at', { ascending: false })
      .limit(20);

    const recentActivity = (recentTxs || []).map(t => ({
      type: t.status === 'confirmed' ? 'DISTRIBUTION_CONFIRMED' : 'DISTRIBUTION_PENDING',
      description: `${Number(t.total_amount_eth || 0).toFixed(4)} ETH ${t.status} — ${t.projects?.name || 'Unknown'}`,
      timestamp: t.created_at,
      txHash: t.tx_hash,
      isDemo: t.is_demo || false,
    }));

    res.json({
      totalDistributed,
      pendingAmount,
      activeContributors,
      totalProjects: (projects || []).length,
      revenueByMonth,
      revenueByRole,
      topHolders,
      recentActivity,
    });
  } catch (err) {
    console.error('[analytics/overview]', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/project/:id — PRD §12
router.get('/project/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;

    // If rights holder, verify they belong to this project
    if (req.user.role === 'RIGHTS_HOLDER') {
      const { data: membership } = await supabase
        .from('rights_holders')
        .select('id')
        .eq('project_id', id)
        .eq('user_id', req.user.id)
        .single();

      if (!membership) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    const { data: project } = await supabase
      .from('projects')
      .select('*, rights_holders(*)')
      .eq('id', id)
      .single();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { data: txs } = await supabase
      .from('transactions')
      .select('*, transaction_splits(*)')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Scope splits if rights holder
    let scopedTxs = txs;
    if (req.user.role === 'RIGHTS_HOLDER') {
      scopedTxs = (txs || []).map(t => ({
        ...t,
        transaction_splits: (t.transaction_splits || []).filter(s => {
          const holder = (project.rights_holders || []).find(h => h.id === s.rights_holder_id);
          return holder && holder.user_id === req.user.id;
        }),
      }));
    }

    res.json({ project, transactions: scopedTxs });
  } catch (err) {
    console.error('[analytics/project]', err);
    res.status(500).json({ error: 'Failed to fetch project analytics' });
  }
});

module.exports = router;
