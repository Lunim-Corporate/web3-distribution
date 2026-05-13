const axios = require('axios');
require('dotenv').config();

const projects = [
  {
    name: "🎬 Film - 'The Last Horizon'",
    description: "Sci-fi indie film with 5 stakeholders sharing revenue",
    contract_address: process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    rightsHolders: [
      { name: "Alex Producer", role: "Producer", wallet_address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", percentage: 35 },
      { name: "Sarah Writer", role: "Writer", wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", percentage: 25 },
      { name: "Mike Director", role: "Director", wallet_address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", percentage: 20 },
      { name: "Emma Actor", role: "Lead Actor", wallet_address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", percentage: 15 },
      { name: "David Editor", role: "Editor", wallet_address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", percentage: 5 }
    ]
  },
  {
    name: "🎵 Album - 'Midnight Echoes'",
    description: "Music album with artist, writer, producer sharing royalties",
    contract_address: process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    rightsHolders: [
      { name: "Alex Producer", role: "Producer", wallet_address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", percentage: 30 },
      { name: "Sarah Artist", role: "Lead Artist", wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", percentage: 35 },
      { name: "Mike Writer", role: "Songwriter", wallet_address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", percentage: 20 },
      { name: "Emma Composer", role: "Composer", wallet_address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", percentage: 10 },
      { name: "David Engineer", role: "Mixing Engineer", wallet_address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", percentage: 5 }
    ]
  },
  {
    name: "📚 Book - 'Digital Dreams'",
    description: "Published book with author, illustrator, editor sharing proceeds",
    contract_address: process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    rightsHolders: [
      { name: "Sarah Author", role: "Author", wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", percentage: 40 },
      { name: "Emma Illustrator", role: "Illustrator", wallet_address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", percentage: 30 },
      { name: "David Editor", role: "Editor", wallet_address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", percentage: 15 },
      { name: "Alex Publisher", role: "Publisher", wallet_address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", percentage: 10 },
      { name: "Mike Marketing", role: "Marketing", wallet_address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", percentage: 5 }
    ]
  },
  {
    name: "🎮 Game - 'Neon Runner'",
    description: "Video game with developers and investors sharing profits",
    contract_address: process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    rightsHolders: [
      { name: "Alex Designer", role: "Game Designer", wallet_address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", percentage: 25 },
      { name: "Mike Developer", role: "Lead Developer", wallet_address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", percentage: 30 },
      { name: "Emma Artist", role: "Artist", wallet_address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", percentage: 20 },
      { name: "David QA", role: "QA Tester", wallet_address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", percentage: 15 },
      { name: "Sarah Investor", role: "Investor", wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", percentage: 10 }
    ]
  },
  {
    name: "🎬 Series - 'Urban Tales'",
    description: "Web series with producers, writers, actors sharing earnings",
    contract_address: process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    rightsHolders: [
      { name: "Mike Showrunner", role: "Showrunner", wallet_address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", percentage: 30 },
      { name: "Sarah Actor", role: "Lead Actor", wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", percentage: 25 },
      { name: "Alex Producer", role: "Executive Producer", wallet_address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", percentage: 20 },
      { name: "Emma Cinematographer", role: "Cinematographer", wallet_address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", percentage: 15 },
      { name: "David Sound", role: "Sound Designer", wallet_address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", percentage: 10 }
    ]
  }
];

async function seed() {
  const SERVER_URL = `http://localhost:${process.env.PORT || 4000}`;

  console.log(`\n🌱 Starting Supabase Seeding via ${SERVER_URL}...`);
  console.log(`📦 Creating ${projects.length} projects with 5 rights holders each...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const projectData of projects) {
    try {
      const response = await axios.post(`${SERVER_URL}/api/projects`, projectData);
      console.log(`✅ ${projectData.name}`);
      console.log(`   ID: ${response.data.id}`);
      console.log(`   Holders: ${response.data.rights_holders?.length || 0}`);
      console.log('');
      successCount++;
    } catch (err) {
      console.error(`❌ ${projectData.name}:`);
      if (err.response) console.error(`   ${err.response.data.error || err.response.data}`);
      else console.error(`   ${err.message}`);
      failCount++;
    }
  }

  console.log('------------------------------------------');
  console.log(`✅ Successfully created: ${successCount} projects`);
  console.log(`❌ Failed: ${failCount} projects`);
  console.log('------------------------------------------\n');
  if (failCount > 0) process.exit(1);
}

seed();
