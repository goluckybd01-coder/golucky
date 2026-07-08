import { describe, it, expect } from 'vitest';
import { AGENT_TIERS, type AgentTier } from '@/lib/agentConfig';

type AgentApplicationInsert = {
  user_id: string;
  tier_requested: AgentTier;
  required_deposit: number;
  deposit_method: string;
  deposit_tx_ref: string;
  status: 'pending' | 'approved' | 'rejected';
};

const BDT_PER_USD = 130;
const genAppRef = () =>
  `APP-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

function buildInsert(userId: string, tier: AgentTier): AgentApplicationInsert {
  const cfg = AGENT_TIERS.find((t) => t.tier === tier)!;
  void Math.ceil(cfg.minDeposit / BDT_PER_USD);
  return {
    user_id: userId,
    tier_requested: tier,
    required_deposit: cfg.minDeposit,
    deposit_method: 'usdt',
    deposit_tx_ref: genAppRef(),
    status: 'pending',
  };
}

const SCHEMA = {
  user_id: 'string',
  tier_requested: 'string',
  required_deposit: 'number',
  deposit_method: 'string',
  deposit_tx_ref: 'string',
  status: 'string',
} as const;

const ALLOWED_TIERS: AgentTier[] = ['starter', 'bronze', 'silver', 'gold', 'diamond', 'elite', 'master'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('AgentApply → agent_applications insert payload', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  it('produces exactly the schema keys (no extras, no missing)', () => {
    const payload = buildInsert(userId, 'gold');
    expect(Object.keys(payload).sort()).toEqual(Object.keys(SCHEMA).sort());
  });

  it('matches column types for every tier', () => {
    for (const t of ALLOWED_TIERS) {
      const p = buildInsert(userId, t) as Record<string, unknown>;
      for (const [col, type] of Object.entries(SCHEMA)) {
        expect(typeof p[col], `${col} for ${t}`).toBe(type);
      }
      expect(p.user_id as string).toMatch(UUID_RE);
      expect(ALLOWED_TIERS).toContain(p.tier_requested as AgentTier);
      expect(p.required_deposit as number).toBeGreaterThan(0);
      expect(Number.isFinite(p.required_deposit as number)).toBe(true);
      expect(p.deposit_method).toBe('usdt');
      expect(p.status).toBe('pending');
      expect((p.deposit_tx_ref as string).startsWith('APP-')).toBe(true);
    }
  });

  it('uses the tier’s configured minDeposit as required_deposit', () => {
    for (const t of ALLOWED_TIERS) {
      const cfg = AGENT_TIERS.find((x) => x.tier === t)!;
      expect(buildInsert(userId, t).required_deposit).toBe(cfg.minDeposit);
    }
  });
});
