const axios = require('axios');
require('dotenv').config();

async function seed() {
  const SERVER_URL = `http://localhost:${process.env.PORT || 4000}`;
  
  console.log(`\n🌱 Starting Supabase Seeding via ${SERVER_URL}...`);

  try {
    const projectData = {
      name: "Moonstone — Project Alpha",
      description: "Standard demonstration project with 5 rights holders.",
      contract_address: process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      rightsHolders: [
        {
          name: "Producer Alpha",
          role: "Production",
          wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat #1
          percentage: 40.00
        },
        {
          name: "Lead Vocalist",
          role: "Performer",
          wallet_address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat #2
          percentage: 20.00
        },
        {
          name: "Guitarist",
          role: "Performer",
          wallet_address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Hardhat #3
          percentage: 15.00
        },
        {
          name: "Drummer",
          role: "Performer",
          wallet_address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Hardhat #4
          percentage: 15.00
        },
        {
          name: "Manager",
          role: "Management",
          wallet_address: "0x9965507D1a056bc2610c68b13E44692700ff4322", // Hardhat #5
          percentage: 10.00
        }
      ]
    };

    const response = await axios.post(`${SERVER_URL}/api/projects`, projectData);
    
    console.log("\n✅ Database Seeded Successfully!");
    console.log("------------------------------------------");
    console.log(`Project ID:   ${response.data.id}`);
    console.log(`Project Name: ${response.data.name}`);
    console.log(`Holders:      ${response.data.rights_holders.length}`);
    console.log("------------------------------------------\n");

  } catch (err) {
    console.error("\n❌ Seeding Failed!");
    if (err.response) {
      console.error("Error Response:", err.response.data);
    } else {
      console.error("Error Message:", err.message);
    }
    console.log("\nTIP: Make sure the backend server (npm run server) is running before seeding.");
  }
}

seed();
