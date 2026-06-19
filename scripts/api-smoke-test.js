const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

const endpoints = [
  { path: '/api/projects', method: 'GET' },
  { path: '/api/revenue?demo=true', method: 'GET' },
  { path: '/api/dashboard?demo=true', method: 'GET' },
  { path: '/api/rights?demo=true', method: 'GET' },
  { path: '/api/users', method: 'GET' },
];

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${endpoint.path}`;
    console.log(`[TESTING] ${endpoint.method} ${url}...`);

    const req = http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            console.log(`✅ ${endpoint.path} passed (HTTP ${res.statusCode})`);
            resolve(true);
          } catch (e) {
            console.log(`❌ ${endpoint.path} returned invalid JSON: ${e.message}`);
            resolve(false);
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          // Expected for protected routes in production, but let's see
          console.log(`⚠️ ${endpoint.path} returned HTTP ${res.statusCode} (Protected - Expected)`);
          resolve(true);
        } else {
          console.log(`❌ ${endpoint.path} failed with HTTP ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${endpoint.path} connection error: ${err.message}`);
      resolve(false);
    });
  });
}

async function runAll() {
  console.log('🚀 Starting API Route Smoke Tests...');
  let allPassed = true;

  for (const ep of endpoints) {
    const passed = await testEndpoint(ep);
    if (!passed) allPassed = false;
  }

  if (allPassed) {
    console.log('\n🎉 ALL API SMOKE TESTS PASSED!');
    process.exit(0);
  } else {
    console.log('\n❌ SOME API SMOKE TESTS FAILED. Verify local server is running.');
    process.exit(1);
  }
}

runAll();
