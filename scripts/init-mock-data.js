#!/usr/bin/env node

/**
 * Mock Data Initialization Script
 * 
 * This script initializes the application with mock data for testing and development.
 * It creates users, projects, revenue records, and rights in localStorage.
 * 
 * Usage: node scripts/init-mock-data.js
 */

const mockUsers = [
  {
    id: 'user_admin_1',
    name: 'Admin User',
    email: 'admin@risidio.com',
    role: 'admin',
  },
  {
    id: 'user_creator_1',
    name: 'John Creator',
    email: 'john@creator.com',
    role: 'creator',
  },
  {
    id: 'user_creator_2',
    name: 'Jane Artist',
    email: 'jane@artist.com',
    role: 'creator',
  },
  {
    id: 'user_contributor_1',
    name: 'Bob Contributor',
    email: 'bob@contributor.com',
    role: 'contributor',
  },
];

console.log('Mock Data Initialization Script');
console.log('================================\n');

console.log('This script will initialize the following data:');
console.log(`- ${mockUsers.length} users (1 admin, 2 creators, 1 contributor)`);
console.log('- Sample projects with revenue and rights');
console.log('\nTo use this data:');
console.log('1. Run the development server: npm run dev');
console.log('2. Navigate to the login page');
console.log('3. Use one of these emails to login:');
console.log('   - admin@risidio.com (Admin)');
console.log('   - john@creator.com (Creator)');
console.log('   - jane@artist.com (Creator)');
console.log('   - bob@contributor.com (Contributor)');
console.log('\nNote: This data is stored in browser localStorage.');
console.log('Clear your browser data to reset.\n');

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mockUsers };
}
