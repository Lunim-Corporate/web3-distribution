import { generateRevenueReport } from './src/app/lib/database';
generateRevenueReport('2026-03-31', '2026-04-30').then(console.log).catch(e => console.error("ERR:", e));
