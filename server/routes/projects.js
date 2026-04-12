const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// GET /api/projects - Fetch all projects with their rights_holders
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_contributors(id, role, revenue_share, users(name, wallet_address))');

    if (error) throw error;
    
    // Map existing schema to exactly what dashboard expects
    const mapped = data.map(p => {
      const rights_holders = (p.project_contributors || []).map(c => ({
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

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, project_contributors(id, user_id, role, revenue_share, users(name, wallet_address))')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Map to expected rights_holders and keep a map by user_id
    const userToRhMap = {};
    const rights_holders = (project.project_contributors || []).map(c => {
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

    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
