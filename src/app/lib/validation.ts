import { z } from 'zod';
import { NextResponse } from 'next/server';

const ethereumAddress = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum address')
  .transform(v => v.toLowerCase() as `0x${string}`);

const ethAmount = z
  .number()
  .positive('Amount must be positive')
  .max(1000, 'Single transaction limited to 1000 ETH');

const uuid = z.string().uuid('Invalid UUID format');

export const safeString = (maxLen = 500) =>
  z.string().trim().max(maxLen, `Exceeds maximum length of ${maxLen}`)
    .transform(v => v.replace(/<[^>]*>/g, ''));

const txHash = z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid transaction hash');

const percentage = z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100');

export const distributePayloadSchema = z.object({
  project_id: uuid,
  amount_eth: ethAmount,
  is_demo: z.boolean().optional().default(false),
  manual_tx_hash: txHash.optional().nullable(),
  sender_address: ethereumAddress.optional(),
  holders: z.array(z.object({
    rights_holder_id: uuid.optional().nullable(),
    wallet_address: ethereumAddress,
    full_name: safeString(200),
    role: safeString(100),
    percentage: percentage,
    amount_eth: z.number().min(0),
  })).min(1, 'At least one holder is required').max(100, 'Maximum 100 holders per distribution'),
});

export const addProjectSchema = z.object({
  name: safeString(200),
  genre: safeString(100).optional().default(''),
  description: safeString(2000).optional().default(''),
  status: z.enum(['active', 'archived', 'draft']).optional().default('active'),
});

export const addRightsHolderSchema = z.object({
  project_id: uuid,
  full_name: safeString(200),
  role: safeString(100),
  percentage: percentage,
  wallet_address: ethereumAddress,
  email: z.string().email().optional(),
});

export const manageRightsHolderSchema = z.object({
  id: uuid,
  action: z.enum(['update', 'delete']),
  full_name: safeString(200).optional(),
  role: safeString(100).optional(),
  percentage: percentage.optional(),
  wallet_address: ethereumAddress.optional(),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  role: z.enum(['ADMIN', 'RIGHTS_HOLDER', 'admin', 'rights_holder']),
});

export const stripeCheckoutSchema = z.object({
  amount_eth: ethAmount,
  project_id: uuid,
  project_name: safeString(200),
});

export const etlIngestSchema = z.object({
  source: z.enum(['stripe', 'manual', 'on-chain', 'csv']),
  project_id: uuid,
  amount_eth: ethAmount.optional(),
  amount_usd: z.number().positive().optional(),
  external_ref_id: z.string().max(256).optional(),
  metadata: z.record(z.unknown()).optional(),
});

function formatZodErrors(error: z.ZodError) {
  return error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
}

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
      return {
        data: null, error: parsed.error,
        response: NextResponse.json({ error: 'Validation failed', details: formatZodErrors(parsed.error) }, { status: 400 }),
      };
    }
    return { data: parsed.data, error: null, response: null };
  } catch {
    return {
      data: null,
      error: new z.ZodError([{ code: 'custom', path: ['body'], message: 'Invalid JSON body' }]),
      response: NextResponse.json({ error: 'Invalid or missing JSON body' }, { status: 400 }),
    };
  }
}

export function validateQuery<T extends z.ZodType>(
  url: string,
  schema: T
): { data: z.infer<T> | null; error: NextResponse | null } {
  const { searchParams } = new URL(url);
  const params = Object.fromEntries(searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return {
      data: null,
      error: NextResponse.json({ error: 'Invalid query parameters', details: formatZodErrors(parsed.error) }, { status: 400 }),
    };
  }
  return { data: parsed.data, error: null };
}
