const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Swap main dashboard header KPI
code = code.replace(
  /<p className="text-2xl font-black text-indigo-400">\{fmtETH\(totalDistributed\)\}<\/p>\s*<p className="text-\[10px\] text-gray-500 font-mono mt-1">\{fmtUSD\(totalDistributed \* ETH_TO_USD\)\}<\/p>/,
  `<p className="text-2xl font-black text-indigo-400">{fmtUSD(totalDistributed * ETH_TO_USD)}</p>\n              <p className="text-[10px] text-gray-500 font-mono mt-1">{fmtETH(totalDistributed)}</p>`
);

// 2. Change Recent Payment Splits amounts to USD
code = code.replace(
  /<p className="text-sm font-black text-white font-mono">\{fmtETH\(tx\.total_amount_eth\)\}<\/p>/g,
  `<p className="text-sm font-black text-white font-mono">{fmtUSD(tx.total_amount_eth * ETH_TO_USD)}</p>`
);

code = code.replace(
  /<span className="text-white font-bold font-mono">\{fmtETH\(s\.amount_eth\)\}<\/span>/g,
  `<span className="text-white font-bold font-mono">{fmtUSD(s.amount_eth * ETH_TO_USD)}</span>`
);

fs.writeFileSync('src/app/dashboard/page.tsx', code);
console.log('page.tsx patched');
