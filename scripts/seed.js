const axios = require('axios');
require('dotenv').config();

const contributorsPool = [
  { name: 'Zara Kimani', role: 'Director', email: 'zara.kimani@moonstone.io', wallet_address: '0xA1b2C3d4E5f6A7B8C9D0E1F2a3B4c5D6e7F8a9B0' },
  { name: 'Cole Hartfield', role: 'Lead Actor', email: 'cole.hartfield@moonstone.io', wallet_address: '0xB2c3D4e5F6a7B8c9D0e1F2A3b4C5d6E7f8A9b0C1' },
  { name: 'Nadia Volkov', role: 'Producer', email: 'nadia.volkov@moonstone.io', wallet_address: '0xC3d4E5f6A7b8C9d0E1f2A3B4c5D6e7F8a9B0c1D2' },
  { name: 'Bayo Akinwande', role: 'Supporting Actor', email: 'bayo.akinwande@moonstone.io', wallet_address: '0xD4e5F6a7B8c9D0e1F2a3B4C5d6E7f8A9b0C1d2E3' },
  { name: 'Mei-Xing Zhao', role: 'Music Composer', email: 'mei-xing.zhao@moonstone.io', wallet_address: '0xE5f6A7b8C9d0E1f2A3b4C5D6e7F8a9B0c1D2e3F4' },
  { name: 'Soren Lindqvist', role: 'Cinematographer', email: 'soren.lindqvist@moonstone.io', wallet_address: '0xF6a7B8c9D0e1F2a3B4c5D6E7f8A9b0C1d2E3f4A5' },
  { name: 'Priya Sharma', role: 'Editor', email: 'priya.sharma@moonstone.io', wallet_address: '0xa7B8c9D0e1F2a3B4c5D6e7F8A9b0C1d2E3f4A5b6' },
  { name: 'Luca Moretti', role: 'Sound Designer', email: 'luca.moretti@moonstone.io', wallet_address: '0xB8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7' },
  { name: 'Amara Osei', role: 'Costume Designer', email: 'amara.osei@moonstone.io', wallet_address: '0xc9D0e1F2a3B4c5D6e7F8a9B0C1d2E3f4A5b6C7d8' },
  { name: 'Kai Nakamura', role: 'VFX Supervisor', email: 'kai.nakamura@moonstone.io', wallet_address: '0xD0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9' },
  { name: 'Elena Vasquez', role: 'Production Manager', email: 'elena.vasquez@moonstone.io', wallet_address: '0xe1F2a3B4c5D6e7F8a9B0c1D2E3f4A5b6C7d8E9f0' },
  { name: 'Tobias Richter', role: 'Gaffer', email: 'tobias.richter@moonstone.io', wallet_address: '0xF2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1' },
  { name: 'Fatima Al-Hassan', role: 'Script Supervisor', email: 'fatima.alhassan@moonstone.io', wallet_address: '0xa3B4c5D6e7F8a9B0c1D2e3F4A5b6C7d8E9f0A1b2' },
  { name: 'Dmitri Petrov', role: 'Stunt Coordinator', email: 'dmitri.petrov@moonstone.io', wallet_address: '0xB4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3' },
  { name: 'Yuna Park', role: 'Art Director', email: 'yuna.park@moonstone.io', wallet_address: '0xc5D6e7F8a9B0c1D2e3F4a5B6C7d8E9f0A1b2C3d4' },
  { name: 'Rafael Santos', role: 'Location Manager', email: 'rafael.santos@moonstone.io', wallet_address: '0xD6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5' },
  { name: 'Ingrid Larsen', role: 'Colorist', email: 'ingrid.larsen@moonstone.io', wallet_address: '0xe7F8a9B0c1D2e3F4a5B6c7D8E9f0A1b2C3d4E5f6' },
  { name: 'Marcus Chen', role: 'Foley Artist', email: 'marcus.chen@moonstone.io', wallet_address: '0xF8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7' },
  { name: 'Aaliya Patel', role: 'Casting Director', email: 'aaliya.patel@moonstone.io', wallet_address: '0xa9B0c1D2e3F4a5B6c7D8e9F0A1b2C3d4E5f6A7b8' },
  { name: 'Felix Braun', role: 'Key Grip', email: 'felix.braun@moonstone.io', wallet_address: '0xB0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9' },
  { name: 'Chioma Eze', role: 'Makeup Artist', email: 'chioma.eze@moonstone.io', wallet_address: '0xc1D2e3F4a5B6c7D8e9F0a1B2C3d4E5f6A7b8C9d0' },
  { name: 'Anders Svensson', role: 'Props Master', email: 'anders.svensson@moonstone.io', wallet_address: '0xD2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1' },
  { name: 'Rosa Delgado', role: 'Dialect Coach', email: 'rosa.delgado@moonstone.io', wallet_address: '0xe3F4a5B6c7D8e9F0a1B2c3D4E5f6A7b8C9d0E1f2' },
  { name: 'Kenji Tanaka', role: 'Steadicam Operator', email: 'kenji.tanaka@moonstone.io', wallet_address: '0xF4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3' },
  { name: 'Anais Dupont', role: 'Set Designer', email: 'anais.dupont@moonstone.io', wallet_address: '0xa5B6c7D8e9F0a1B2c3D4e5F6A7b8C9d0E1f2A3b4' },
  { name: 'Emeka Okonkwo', role: 'Unit Manager', email: 'emeka.okonkwo@moonstone.io', wallet_address: '0xB6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5' },
  { name: 'Hana Yoshida', role: 'Score Arranger', email: 'hana.yoshida@moonstone.io', wallet_address: '0xc7D8e9F0a1B2c3D4e5F6a7B8C9d0E1f2A3b4C5d6' },
  { name: 'Viktor Novak', role: 'DIT Supervisor', email: 'viktor.novak@moonstone.io', wallet_address: '0xD8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7' },
  { name: 'Leila Khoury', role: 'Line Producer', email: 'leila.khoury@moonstone.io', wallet_address: '0xe9F0a1B2c3D4e5F6a7B8c9D0E1f2A3b4C5d6E7f8' }
];

const projectsData = [
  { name: 'Dust & Dynasty', type: 'Film', amount: 6400, contributors: 6 },
  { name: 'The Salt Coast', type: 'Series', amount: 9600, contributors: 6 },
  { name: 'Glass Republic', type: 'Film', amount: 3520, contributors: 6 },
  { name: 'Binary Fault', type: 'Tech Thriller', amount: 3200, contributors: 6 },
  { name: 'Neon Requiem', type: 'Film Noir', amount: 3520, contributors: 5 }
];

function generateTxHash() {
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

async function seed() {
  const SERVER_URL = `http://localhost:${process.env.PORT || 3001}`; // Using 3001 as default for development

  console.log(`\n🌱 Seeding LUNIM Dashboard with Premium Data...`);
  
  let totalUSD = 0;
  let totalHolders = 0;

  for (let i = 0; i < projectsData.length; i++) {
    const p = projectsData[i];
    const holders = contributorsPool.slice(totalHolders, totalHolders + p.contributors);
    totalHolders += p.contributors;

    const basePercent = Math.floor((100 / holders.length) * 10) / 10;
    const remainder = parseFloat((100 - (basePercent * holders.length)).toFixed(1));

    const projectPayload = {
      name: p.name,
      type: p.type,
      description: `Premium ${p.type} Project`,
      contract_address: '0x0000000000000000000000000000000000000000',
      rightsHolders: holders.map((c, idx) => ({
        ...c,
        percentage: idx === 0 ? parseFloat((basePercent + remainder).toFixed(1)) : basePercent
      }))
    };

    try {
      // 1. Create Project
      const projRes = await axios.post(`${SERVER_URL}/api/projects`, projectPayload);
      const projectId = projRes.data.id;
      console.log(`✅ Project: ${p.name} (${p.contributors} holders)`);

      // 2. Record Payments (Total matches screenshot)
      // We'll split the total into 2 transactions for variety, total 9-10 across all projects
      const txCount = i === 0 ? 1 : 2; 
      const amountPerTx = p.amount / txCount;

      for (let j = 0; j < txCount; j++) {
        await axios.post(`http://localhost:3000/api/payments/record`, {
          projectId,
          amountEth: amountPerTx / 3500, // Roughly 0.1 - 2.0 ETH
          totalUSD: amountPerTx,
          txHash: generateTxHash(),
          source: 'Client Revenue'
        });
        totalUSD += amountPerTx;
      }
      
    } catch (err) {
      console.error(`❌ Error seeding ${p.name}:`, err.response?.data?.error || err.message);
    }
  }

  console.log('\n------------------------------------------');
  console.log(`📊 Final Seed Stats:`);
  console.log(`   Total Distributed: $${totalUSD.toLocaleString()}`);
  console.log(`   Total Contributors: ${totalHolders}`);
  console.log(`   Projects Created: ${projectsData.length}`);
  console.log('------------------------------------------\n');
}

seed();
