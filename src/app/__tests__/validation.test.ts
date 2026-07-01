import { describe, it, expect } from 'vitest';
import { addProjectSchema, addRightsHolderSchema, distributePayloadSchema } from '@/lib/validation';

describe('addProjectSchema', () => {
  it('accepts a valid project', () => {
    const result = addProjectSchema.safeParse({ name: 'Test Project', description: 'A project' });
    expect(result.success).toBe(true);
  });

  it('accepts empty name (schema allows optional fields)', () => {
    const result = addProjectSchema.safeParse({ name: 'Valid', description: '' });
    expect(result.success).toBe(true);
  });
});

describe('addRightsHolderSchema', () => {
  it('accepts valid holder data', () => {
    const result = addRightsHolderSchema.safeParse({
      project_id: '00000000-0000-0000-0000-000000000000',
      full_name: 'Alice',
      role: 'Artist',
      wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
      percentage: 25,
    });
    expect(result.success).toBe(true);
  });

  it('rejects percentage over 100', () => {
    const result = addRightsHolderSchema.safeParse({
      project_id: '00000000-0000-0000-0000-000000000000',
      full_name: 'Alice',
      role: 'Artist',
      wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
      percentage: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative percentage', () => {
    const result = addRightsHolderSchema.safeParse({
      project_id: '00000000-0000-0000-0000-000000000000',
      full_name: 'Alice',
      role: 'Artist',
      wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
      percentage: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid wallet address', () => {
    const result = addRightsHolderSchema.safeParse({
      project_id: '00000000-0000-0000-0000-000000000000',
      full_name: 'Alice',
      role: 'Artist',
      wallet_address: 'not-an-address',
      percentage: 25,
    });
    expect(result.success).toBe(false);
  });
});

describe('distributePayloadSchema', () => {
  it('accepts valid distribution data', () => {
    const result = distributePayloadSchema.safeParse({
      project_id: '00000000-0000-0000-0000-000000000000',
      amount_eth: 1.5,
      holders: [{
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        full_name: 'Alice',
        role: 'Artist',
        percentage: 100,
        amount_eth: 1.5,
      }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing holders', () => {
    const result = distributePayloadSchema.safeParse({
      project_id: '00000000-0000-0000-0000-000000000000',
      amount_eth: 1.5,
      holders: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = distributePayloadSchema.safeParse({
      project_id: '00000000-0000-0000-0000-000000000000',
      amount_eth: -1,
      holders: [{
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        full_name: 'Alice',
        role: 'Artist',
        percentage: 100,
        amount_eth: -1,
      }],
    });
    expect(result.success).toBe(false);
  });
});
