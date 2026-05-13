const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Insert const ETH_TO_USD = 3200; if it doesn't exist
if (!code.includes('const ETH_TO_USD = 3200;')) {
  code = code.replace(
    "const fmtETH = (n: number) => `${n.toFixed(4)} ETH`;",
    "const ETH_TO_USD = 3200;\nconst fmtETH = (n: number) => `${n.toFixed(4)} ETH`;"
  );
}

fs.writeFileSync('src/app/dashboard/page.tsx', code);
console.log('page.tsx patched again');
