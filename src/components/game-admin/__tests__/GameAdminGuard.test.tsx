import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import GameAdminGuard from '../GameAdminGuard';

type RoleRow = { role: string };

const state: {
  roles: RoleRow[];
  staff: { staff_role: string; is_active: boolean } | null;
} = { roles: [], staff: null };

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: 'u1' } } }),
    },
    from: (table: string) => {
      if (table === 'user_roles') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: state.roles, error: null }),
          }),
        };
      }
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: () => Promise.resolve({ data: state.staff, error: null }),
      };
      return chain;
    },
  },
}));

const renderGuard = () =>
  render(
    <MemoryRouter>
      <GameAdminGuard>
        <div>PROTECTED_CONTENT</div>
      </GameAdminGuard>
    </MemoryRouter>
  );

describe('GameAdminGuard', () => {
  beforeEach(() => {
    state.roles = [];
    state.staff = null;
  });

  it('allows users with agent_admin role', async () => {
    state.roles = [{ role: 'agent_admin' }];
    renderGuard();
    await waitFor(() =>
      expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument()
    );
  });

  it('allows users with finance_admin role', async () => {
    state.roles = [{ role: 'finance_admin' }];
    renderGuard();
    await waitFor(() =>
      expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument()
    );
  });

  it('allows users with an active staff_accounts entry even without a role', async () => {
    state.roles = [];
    state.staff = { staff_role: 'support', is_active: true };
    renderGuard();
    await waitFor(() =>
      expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument()
    );
  });

  it('denies users with no role and no staff account', async () => {
    renderGuard();
    await waitFor(() =>
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    );
    expect(screen.queryByText('PROTECTED_CONTENT')).not.toBeInTheDocument();
  });
});
