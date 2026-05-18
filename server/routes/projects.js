const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// GET /api/projects - Fetch all projects with their rights_holders
router.get('/', async (req, res) => {
  try {
    // First get all projects
    const { data: projects, error: pErr } = await supabase
      .from('projects')
      .select('*');

    if (pErr) throw pErr;

    // Then get all contributors
    const { data: contributors, error: cErr } = await supabase
      .from('project_contributors')
      .select('*, users(name, wallet_address)');
    
    // If there's an error with users join, try without it
    let contributorsData = contributors || [];
    if (cErr) {
      const { data: simpleContributors } = await supabase
        .from('project_contributors')
        .select('*');
      contributorsData = (simpleContributors || []).map(c => ({ ...c, users: null }));
    }

    // Map projects with their contributors
    const mapped = (projects || []).map(p => {
      const projectContributors = contributorsData.filter(c => c.project_id === p.id);
      const rights_holders = projectContributors.map(c => ({
        id: c.id,
        name: c.users?.name || 'Unknown',
        role: c.role,
        wallet_address: c.users?.wallet_address || '',
        percentage: c.revenue_share,
        total_received: 0 
      }));
      return { ...p, rights_holders, total_distributed: p.total_revenue };
    });
    
    res.json(mapped);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:projectId - Single project with rights_holders and last 20 transactions
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get project first
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Get contributors separately
    const { data: contributors, error: contribError } = await supabase
      .from('project_contributors')
      .select('*, users(name, wallet_address)')
      .eq('project_id', projectId);
    
    // Fallback without users join if needed
    let contributorsData = contributors || [];
    if (contribError) {
      const { data: simple } = await supabase
        .from('project_contributors')
        .select('*')
        .eq('project_id', projectId);
      contributorsData = (simple || []).map(c => ({ ...c, users: null }));
    }

    // Map to expected rights_holders and keep a map by user_id
    const userToRhMap = {};
    const rights_holders = contributorsData.map(c => {
      const rh = {
        id: c.id,
        user_id: c.user_id,
        name: c.users?.name || 'Unknown',
        role: c.role,
        wallet_address: c.users?.wallet_address || '',
        percentage: c.revenue_share,
        total_received: 0
      };
      if (c.user_id) userToRhMap[c.user_id] = rh;
      return rh;
    });

    // Fetch payments without the ambiguous users join
    const { data: payments, error: ptError } = await supabase
      .from('payments')
      .select('id, user_id, amount, tx_hash, status, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (ptError) throw ptError;

    // Grouping payments into expected "transactions" format
    const txMap = {};
    (payments || []).forEach(p => {
      const hash = p.tx_hash || `mock-${Date.now()}`;
      if (!txMap[hash]) {
        txMap[hash] = {
          id: hash,
          tx_hash: hash,
          created_at: p.created_at,
          status: p.status || 'confirmed',
          total_amount: 0,
          transaction_splits: []
        };
      }
      
      const paymentAmount = Number(p.amount) || 0;
      txMap[hash].total_amount += paymentAmount;
      
      // Manual join using our map
      const rh = userToRhMap[p.user_id] || {};
      const userName = rh.name || 'Unknown';
      
      txMap[hash].transaction_splits.push({
        id: p.id,
        name: userName,
        role: rh.role || 'Contributor',
        percentage: rh.percentage || 0,
        amount_eth: paymentAmount
      });
      
      // Accumulate total_received locally
      if (rh.id) {
         rh.total_received = (rh.total_received || 0) + paymentAmount;
      }
    });

    const transactions = Object.values(txMap);

    res.json({ ...project, total_distributed: project.total_revenue, rights_holders, transactions });
  } catch (err) {
    console.error('Error fetching project details:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects - Create a new project with rights holders
router.post('/', async (req, res) => {
  try {
    const { name, description, contract_address, rightsHolders } = req.body;

    // 1. Create project
    const { data: project, error: pError } = await supabase
      .from('projects')
      .insert([{
        name,
        description,
        contract_address,
        total_revenue: 0,
        status: 'active'
      }])
      .select()
      .single();

    if (pError) throw pError;

    // 2. Create contributors/users
    if (rightsHolders && rightsHolders.length > 0) {
      for (const holder of rightsHolders) {
        // Find or create user
        let { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', holder.wallet_address)
          .maybeSingle();

        if (!user) {
          const { data: newUser } = await supabase
            .from('users')
            .insert([{
              name: holder.name,
              wallet_address: holder.wallet_address,
              role: 'contributor',
              email: `${holder.name.toLowerCase().replace(/\s+/g, '')}@example.com`
            }])
            .select()
            .single();
          user = newUser;
        }

        // Insert contributor record
        await supabase.from('project_contributors').insert([{
          project_id: project.id,
          user_id: user.id,
          role: holder.role,
          revenue_share: holder.percentage
        }]);
      }
    }

    // Fetch created project with rights_holders (without join - handle separately)
    let rights_holders = [];
    try {
      const { data: contributors } = await supabase
        .from('project_contributors')
        .select('id, role, revenue_share, users(name, wallet_address)')
        .eq('project_id', project.id);
      rights_holders = (contributors || []).map(c => ({
        id: c.id,
        name: c.users?.name || 'Unknown',
        role: c.role,
        wallet_address: c.users?.wallet_address || '',
        percentage: c.revenue_share,
        total_received: 0
      }));
    } catch (e) {
      console.log('No contributors found or error:', e.message);
    }

    res.status(201).json({ ...project, rights_holders });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/contributors/:id - Update contributor share
router.patch('/contributors/:id', validate([
  body('revenue_share').isNumeric().withMessage('Revenue share must be a number')
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { revenue_share } = req.body;
    
    const { data, error } = await supabase
      .from('project_contributors')
      .update({ revenue_share })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error updating contributor:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/contributors/:id - Remove contributor
router.delete('/contributors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('project_contributors')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error removing contributor:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
