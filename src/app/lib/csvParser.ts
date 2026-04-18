'use client';

/**
 * CSV Roster Parser & Template Generator
 *
 * Provides utilities for bulk-importing creators into a project roster
 * via a formatted CSV file.
 */

export interface CsvRow {
  name: string;
  wallet_address: string;
  role: string;
  revenue_share: number;
}

export interface CsvParseResult {
  rows: CsvRow[];
  errors: string[];
}

const EXPECTED_HEADERS = ['name', 'wallet_address', 'role', 'revenue_share'];
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Parse raw CSV text into validated roster rows.
 *
 * @param csvText - Raw CSV string (first row must be headers)
 * @returns `{ rows, errors }` — valid rows and line-numbered error messages
 */
export function parseCsvRoster(csvText: string): CsvParseResult {
  const rows: CsvRow[] = [];
  const errors: string[] = [];

  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    errors.push('CSV file is empty.');
    return { rows, errors };
  }

  // --- Header validation ---
  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.trim());

  const missingHeaders = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`Missing required headers: ${missingHeaders.join(', ')}. Expected: ${EXPECTED_HEADERS.join(', ')}`);
    return { rows, errors };
  }

  // Map column index → field name
  const colIndex: Record<string, number> = {};
  EXPECTED_HEADERS.forEach((h) => {
    colIndex[h] = headers.indexOf(h);
  });

  // --- Row validation ---
  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1; // 1-indexed for user display
    const cells = lines[i].split(',').map((c) => c.trim());

    // Extract values
    const name = cells[colIndex['name']] ?? '';
    const wallet = cells[colIndex['wallet_address']] ?? '';
    const role = cells[colIndex['role']] ?? '';
    const shareRaw = cells[colIndex['revenue_share']] ?? '';

    const rowErrors: string[] = [];

    if (!name) {
      rowErrors.push('name is empty');
    }

    if (!WALLET_REGEX.test(wallet)) {
      rowErrors.push(`wallet_address "${wallet}" is not a valid Ethereum address (must be 0x + 40 hex chars)`);
    }

    if (!role) {
      rowErrors.push('role is empty');
    }

    const share = parseInt(shareRaw, 10);
    if (isNaN(share) || share < 0 || share > 100) {
      rowErrors.push(`revenue_share "${shareRaw}" must be an integer between 0 and 100`);
    }

    if (rowErrors.length > 0) {
      errors.push(`Line ${lineNum}: ${rowErrors.join('; ')}`);
    } else {
      rows.push({ name, wallet_address: wallet, role, revenue_share: share });
    }
  }

  // Duplicate wallet check
  const wallets = rows.map((r) => r.wallet_address.toLowerCase());
  const seen = new Set<string>();
  wallets.forEach((w, idx) => {
    if (seen.has(w)) {
      errors.push(`Duplicate wallet address: ${rows[idx].wallet_address} (appears more than once)`);
    }
    seen.add(w);
  });

  return { rows, errors };
}

/**
 * Generate a downloadable CSV template with example rows.
 */
export function generateCsvTemplate(): string {
  return [
    'name,wallet_address,role,revenue_share',
    'Alice Johnson,0x1234567890abcdef1234567890abcdef12345678,Lead Engineer,25',
    'Bob Smith,0xabcdef1234567890abcdef1234567890abcdef12,Designer,15',
  ].join('\n');
}
