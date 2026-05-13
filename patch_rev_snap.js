const fs = require('fs');
let code = fs.readFileSync('src/app/components/dashboard/RevenueSnapshot.tsx', 'utf8');

// Fix formatting of totals
code = code.replace(
  "{formatUSD(totals.total)}",
  "{formatUSD(totals.total * 3200)}"
);
code = code.replace(
  "{formatUSD(totals.paid)}",
  "{formatUSD(totals.paid * 3200)}"
);
code = code.replace(
  "{formatUSD(r.amount)}",
  "{formatUSD(r.amount * 3200)}"
);

// Move chevron from Date to Status
const dateTdRegex = /<td className="px-5 py-3\.5 text-sm text-gray-400 whitespace-nowrap font-mono flex items-center gap-2">\s*\{hasSplits && <span className="text-gray-500 text-xs w-3">\{isExpanded \? '▼' : '▶'\}<\/span>\}\s*\{!hasSplits && <span className="w-3"><\/span>\}\s*\{new Date\(r\.date\)\.toLocaleDateString\('en-US', \{ month: 'short', day: 'numeric', year: 'numeric' \}\)\}\s*<\/td>/;
code = code.replace(dateTdRegex, `<td className="px-5 py-3.5 text-sm text-gray-400 whitespace-nowrap font-mono">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>`);

const statusTdRegex = /<td className="px-5 py-3\.5">\s*<span className=\{\`px-2\.5 py-1 rounded-full text-\[10px\] font-black tracking-wide \$\{\s*r\.status === 'Paid'\s*\? 'bg-emerald-500\/15 text-emerald-400 border border-emerald-500\/20'\s*: 'bg-amber-500\/15 text-amber-400 border border-amber-500\/20'\s*\}\`\}>\s*\{r\.status\}\s*<\/span>\s*<\/td>/;
code = code.replace(statusTdRegex, `<td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-4">
                          <span className={\`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide \${
                            r.status === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          }\`}>
                            {r.status}
                          </span>
                          <span className="text-gray-500 text-xs w-3 text-center">{hasSplits ? (isExpanded ? '▼' : '▶') : ''}</span>
                        </div>
                      </td>`);

fs.writeFileSync('src/app/components/dashboard/RevenueSnapshot.tsx', code);
console.log('RevenueSnapshot patched');
