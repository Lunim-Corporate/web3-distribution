/**
 * Zod-based input validation schemas for all API write endpoints.
 * 
 * Every POST/PUT/PATCH handler must validate its body through
 * the appropriate schema before processing.
 */

import { z } from 'zod';

// ──────────────────────────────────────────────
// Primitives & Reusable Patterns
// ──────────────────────────────────────────────

/** Ethereum address: 0x followed by 40 hex chars */
const ethereumAddress = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum address')
  .transform(v => v.toLowerCase() as `0x${string}`);

/** Positive ETH amount, capped at 1000 ETH per transaction */
const ethAmount = z
  .number()
  .positive('Amount must be positive')
  .max(1000, 'Single transaction limited to 1000 ETH');

/** UUID v4 */
const uuid = z.string().uuid('Invalid UUID format');

/** Safe string — trimmed, no HTML tags, max length */
const safeString = (maxLen = 500) =>
  z
    .string()
    .trim()
    .max(maxLen, `Exceeds maximum length of ${maxLen}`)
    .transform(v => v.replace(/<[^>]*>/g, '')); // Strip HTML

/** Transaction hash: 0x followed by 64 hex chars */
const txHash = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid transaction hash');

/** Percentage: 0–100 */
const percentage = z
  .number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100');

// ──────────────────────────────────────────────
// API-specific Schemas
// ──────────────────────────────────────────────

/** POST /api/web3/auto-distribute */
export const distributePayloadSchema = z.object({
  project_id: uuid,
  amount_eth: ethAmount,
  is_demo: z.boolean().optional().default(false),
  manual_tx_hash: txHash.optional().nullable(),
  sender_address: ethereumAddress.optional(),
  holders: z
    .array(
      z.object({
        rights_holder_id: uuid.optional().nullable(),
        wallet_address: ethereumAddress,
        full_name: safeString(200),
        role: safeString(100),
        percentage: percentage,
        amount_eth: z.number().min(0),
      })
    )
    .min(1, 'At least one holder is required')
    .max(100, 'Maximum 100 holders per distribution'),
});

/** POST /api/projects/add */
export const addProjectSchema = z.object({
  name: safeString(200),
  genre: safeString(100).optional().default(''),
  description: safeString(2000).optional().default(''),
  status: z.enum(['active', 'archived', 'draft']).optional().default('active'),
});

/** POST /api/rights/add */
export const addRightsHolderSchema = z.object({
  project_id: uuid,
  full_name: safeString(200),
  role: safeString(100),
  percentage: percentage,
  wallet_address: ethereumAddress.optional(),
  email: z.string().email().optional(),
});

/** POST /api/rights/manage */
export const manageRightsHolderSchema = z.object({
  id: uuid,
  action: z.enum(['update', 'delete']),
  full_name: safeString(200).optional(),
  role: safeString(100).optional(),
  percentage: percentage.optional(),
  wallet_address: ethereumAddress.optional(),
});

/** PUT /api/users */
export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  role: z.enum(['ADMIN', 'RIGHTS_HOLDER', 'admin', 'rights_holder']),
});

/** POST /api/stripe/checkout */
export const stripeCheckoutSchema = z.object({
  amount_eth: ethAmount,
  project_id: uuid,
  project_name: safeString(200),
});

/** POST /api/auth/sync */
export const authSyncSchema = z.object({
  privyUser: z.object({
    id: z.string().min(1),
    email: z.object({
      address: z.string().email(),
    }),
    wallet: z.object({
      address: ethereumAddress,
      walletClientType: z.string().optional(),
    }).optional().nullable(),
  }),
});

/** POST /api/auth/invite */
export const authInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'RIGHTS_HOLDER']).optional().default('RIGHTS_HOLDER'),
  project_id: uuid.optional(),
});

/** GET /api/reports query params */
export const reportQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  projectId: uuid.optional(),
  demo: z.enum(['true', 'false']).optional(),
});

/** POST /api/reports (export) */
export const reportExportSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  projectId: uuid.optional(),
  format: z.enum(['csv', 'json', 'pdf']).optional().default('csv'),
  demo: z.boolean().optional().default(false),
});

/** POST /api/etl/ingest */
export const etlIngestSchema = z.object({
  source: z.enum(['stripe', 'manual', 'on-chain', 'csv']),
  project_id: uuid,
  amount_eth: ethAmount.optional(),
  amount_usd: z.number().positive().optional(),
  external_ref_id: z.string().max(256).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ──────────────────────────────────────────────
// Helper: validate and return parsed data or error response
// ──────────────────────────────────────────────

import { NextResponse } from 'next/server';

/**
 * Validates request body against a Zod schema.
 * Returns { data } on success, { error, response } on failure.
 *
 * Usage:
 *   const result = await validateBody(req, distributePayloadSchema);
 *   if (result.error) return result.response;
 *   const { project_id, holders, ... } = result.data;
 */
export async function validateBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<
  | { data: z.infer<T>; error: null; response: null }
  | { data: null; error: z.ZodError; response: NextResponse }
> {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return {
        data: null,
        error: parsed.error,
        response: NextResponse.json(
          {
            error: 'Validation failed',
            details: fieldErrors,
          },
          { status: 400 }
        ),
      };
    }

    return { data: parsed.data, error: null, response: null };
  } catch {
    return {
      data: null,
      error: new z.ZodError([
        {
          code: 'custom',
          path: ['body'],
          message: 'Invalid JSON body',
        },
      ]),
      response: NextResponse.json(
        { error: 'Invalid or missing JSON body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validates query params against a Zod schema.
 */
export function validateQuery<T extends z.ZodType>(
  url: string,
  schema: T
): { data: z.infer<T> | null; error: NextResponse | null } {
  const { searchParams } = new URL(url);
  const params = Object.fromEntries(searchParams.entries());
  const parsed = schema.safeParse(params);

  if (!parsed.success) {
    const fieldErrors = parsed.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return {
      data: null,
      error: NextResponse.json(
        { error: 'Invalid query parameters', details: fieldErrors },
        { status: 400 }
      ),
    };
  }

  return { data: parsed.data, error: null };
}
