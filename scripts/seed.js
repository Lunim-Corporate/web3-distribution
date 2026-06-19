const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { HDNodeWallet, Mnemonic } = require('ethers');

// Initialize Supabase admin client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate deterministic wallet addresses from Hardhat mnemonic
// Set HARDHAT_MNEMONIC in .env.local to override; defaults to Hardhat's standard test mnemonic
const HARDHAT_MNEMONIC = process.env.HARDHAT_MNEMONIC || 'test test test test test test test test test test test junk';
const mnemonic = Mnemonic.fromPhrase(HARDHAT_MNEMONIC);
const getWallet = (index) => HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${index}`).address;

const seedData = async () => {
  console.log("🌱 Starting database seed...");

  // 1. Delete all existing data
  const { error: errSplits } = await supabase.from('transaction_splits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errSplits) console.warn("Failed to delete splits:", errSplits.message);
  
  const { error: errTx } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errTx) console.warn("Failed to delete transactions:", errTx.message);

  const { error: errRights } = await supabase.from('rights_holders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errRights) console.warn("Failed to delete rights holders:", errRights.message);

  const { error: err1 } = await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (err1) throw err1;
  console.log("Cleaned existing data...");

  const projects = [
    {
      name: "Neon Requiem",
      genre: "Sci-Fi Thriller",
      description: "A rogue AI infiltrates a megacity's neural grid, forcing a burned intelligence officer to confront her own manufactured memories.",
      status: "active",
      holders: [
        { full_name: "Aria Voss", role: "Director", percentage: 28 },
        { full_name: "Marcus Delgado", role: "Lead Actor", percentage: 22 },
        { full_name: "Priya Nair", role: "Producer", percentage: 18 },
        { full_name: "Theo Harrington", role: "Music Composer", percentage: 17 },
        { full_name: "Simone Okafor", role: "Screenplay Writer", percentage: 15 }
      ]
    },
    {
      name: "Dust & Dynasty",
      genre: "Historical Drama",
      description: "Three generations of a mining family fight to reclaim stolen land in 1920s Appalachia while a powerful railroad baron closes in.",
      status: "active",
      holders: [
        { full_name: "Felix Drummond", role: "Director", percentage: 25 },
        { full_name: "Yuki Tanaka", role: "Lead Actress", percentage: 20 },
        { full_name: "Camille Renard", role: "Producer", percentage: 18 },
        { full_name: "Olu Adeyemi", role: "Supporting Actor", percentage: 14 },
        { full_name: "Dana Whitfield", role: "Music Composer", percentage: 13 },
        { full_name: "Ravi Pillai", role: "Screenplay Writer", percentage: 10 }
      ]
    },
    {
      name: "Glass Republic",
      genre: "Political Thriller",
      description: "A whistleblower leaks classified files that expose a sitting government's surveillance program, triggering a cross-continental manhunt.",
      status: "active",
      holders: [
        { full_name: "Natasha Verne", role: "Director", percentage: 26 },
        { full_name: "Leon Pacheco", role: "Lead Actor", percentage: 21 },
        { full_name: "Ingrid Solberg", role: "Producer", percentage: 17 },
        { full_name: "Amara Diallo", role: "Co-Producer", percentage: 13 },
        { full_name: "Jin-Ho Park", role: "Music Composer", percentage: 12 },
        { full_name: "Selene Marsh", role: "Screenplay Writer", percentage: 11 }
      ]
    },
    {
      name: "The Salt Coast",
      genre: "Crime Drama",
      description: "A retired coast guard officer in a remote fishing village uncovers a smuggling ring that reaches the highest levels of local government.",
      status: "active",
      holders: [
        { full_name: "Declan Fogarty", role: "Director", percentage: 24 },
        { full_name: "Mara Solis", role: "Lead Actress", percentage: 22 },
        { full_name: "Emeka Osei", role: "Producer", percentage: 17 },
        { full_name: "Hana Bergström", role: "Supporting Actress", percentage: 15 },
        { full_name: "Tobias Frei", role: "Music Composer", percentage: 12 },
        { full_name: "Leila Mousavi", role: "Screenplay Writer", percentage: 10 }
      ]
    },
    {
      name: "Binary Fault",
      genre: "Tech Thriller",
      description: "A pair of rival hackers discover their competing zero-days are pieces of the same weapon, and someone very dangerous wants it complete.",
      status: "active",
      holders: [
        { full_name: "Zara Kimani", role: "Director", percentage: 27 },
        { full_name: "Cole Hartfield", role: "Lead Actor", percentage: 21 },
        { full_name: "Nadia Volkov", role: "Producer", percentage: 16 },
        { full_name: "Bayo Akinwande", role: "Supporting Actor", percentage: 14 },
        { full_name: "Mei-Xing Zhao", role: "Music Composer", percentage: 12 },
        { full_name: "Soren Lindqvist", role: "Screenplay Writer", percentage: 10 }
      ]
    },
  ];

  let accountIndex = 1;
  let totalHoldersInserted = 0;

  for (const proj of projects) {
    const { data: projectData, error: projErr } = await supabase
      .from('projects')
      .insert({
        name: proj.name,
        genre: proj.genre,
        description: proj.description,
        status: proj.status
      })
      .select()
      .single();

    if (projErr) throw projErr;

    const projectId = projectData.id;
    const holdersToInsert = proj.holders.map(h => {
      const addr = getWallet(accountIndex++);
      return {
        project_id: projectId,
        full_name: h.full_name,
        role: h.role,
        percentage: h.percentage,
        wallet_address: addr
      };
    });

    const { error: holderErr } = await supabase
      .from('rights_holders')
      .insert(holdersToInsert);

    if (holderErr) throw holderErr;
    totalHoldersInserted += holdersToInsert.length;
  }

  console.log('\n┌─────────────────────────────────────────────────────┐');
  console.log('│  LUNIM — Seed Complete                              │');
  console.log('├──────────────────┬──────────────────────────────────┤');
  console.log(`│  Projects        │  ${projects.length}                               │`);
  console.log(`│  Rights Holders  │  ${totalHoldersInserted}                              │`);
  console.log('└──────────────────┴──────────────────────────────────┘\n');
};

seedData().catch(console.error);
