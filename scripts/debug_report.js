const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugReport() {
  const startDate = '2026-04-14';
  const endDate = '2026-05-14';
  const endOfDay = `${endDate}T23:59:59.999Z`;

  console.log('1. Fetching payments...');
  let paymentQuery = supabaseAdmin
    .from('payments')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endOfDay);

  const { data: payments, error: paymentError } = await paymentQuery;
  if (paymentError) { console.error(paymentError); return; }
  console.log('Payments found:', payments.length);

  console.log('2. Fetching projects...');
  const { data: projects, error: projectError } = await supabaseAdmin.from('projects').select('id, name');
  if (projectError) { console.error(projectError); return; }
  const projectLookup = (projects || []).reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
  console.log('Projects lookup ready');

  console.log('3. Fetching contributors...');
  const projectIds = Array.from(new Set(payments?.map(p => p.project_id) || []));
  let contributors = [];
  if (projectIds.length > 0) {
    const { data: contribs, error: contribError } = await supabaseAdmin
      .from('project_contributors')
      .select('project_id, user_id, revenue_share, role')
      .in('project_id', projectIds);
    if (contribError) { console.error(contribError); return; }
    contributors = contribs || [];
  }
  console.log('Contributors found:', contributors.length);

  console.log('4. Aggregating...');
  const sourceMap = new Map();
  const projectMap = new Map();
  const uniqueTxHashes = new Set();
  let totalRevenue = 0;

  payments?.forEach((payment, idx) => {
    if (idx % 10 === 0) console.log(`Processing payment ${idx}...`);
    const amount = (Number(payment.amount) || 0) / 100;
    totalRevenue += amount;

    if (payment.tx_hash) {
      uniqueTxHashes.add(payment.tx_hash);
    } else {
      uniqueTxHashes.add(payment.id);
    }

    const source = payment.source || 'Client Payment';
    sourceMap.set(source, {
      amount: (sourceMap.get(source)?.amount || 0) + amount,
      count: (sourceMap.get(source)?.count || 0) + 1,
    });

    const projData = projectLookup[payment.project_id];
    if (projData) {
      const projId = projData.id;
      const current = projectMap.get(projId) || {
        revenue: 0,
        paid: 0,
        contributors: new Set(),
        name: projData.name || 'Unknown',
        rightsHolders: []
      };
      
      current.revenue += amount;
      current.paid += amount;
      
      const projectContributors = contributors.filter(c => c.project_id === projId);
      current.rightsHolders = projectContributors.map(c => ({
        name: 'Unknown',
        role: c.role || 'Contributor',
        percentage: c.revenue_share || 0
      }));
      projectContributors.forEach(c => {
        current.contributors.add(c.user_id);
      });

      projectMap.set(projId, current);
    }
  });

  console.log('Aggregation complete');
  console.log('Total Revenue:', totalRevenue);
  console.log('Projects:', projectMap.size);
}

debugReport();
