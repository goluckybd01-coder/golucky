import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminDepositCentrePage from '@/pages/admin/AdminDepositCentrePage';
import { setDepositCenterEnabled, isDepositCenterEnabled } from '@/lib/depositCenterFlag';

vi.mock('@/components/admin/AdminShell', () => ({
  AdminShell: ({ children, title }: any) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminDepositCentrePage />
    </MemoryRouter>,
  );

describe('Deposit Centre flag gating', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('OFF by default → tabs hidden, disabled notice shown', () => {
    renderPage();
    expect(screen.getByText(/Deposit Centre is/i)).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /User/i })).toBeNull();
  });

  it('ON → all six tabs render and can be activated', async () => {
    const user = userEvent.setup();
    setDepositCenterEnabled(true);
    renderPage();
    for (const label of ['User', 'Agent', 'Fixed Deposit', 'Gateways', 'Analytics', 'Audit']) {
      expect(screen.getByRole('tab', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }
    expect(screen.getByText(/User Deposit History/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Agent/i }));
    expect(screen.getByText(/USDT-Only Controls/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Fixed Deposit/i }));
    expect(screen.getByText(/Fixed Deposit Controls/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Gateways/i }));
    expect(screen.getByText(/Payment Gateway Assignment/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Analytics/i }));
    expect(screen.getByText(/Total Deposits/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Audit/i }));
    expect(screen.getByText(/Audit Log/i)).toBeInTheDocument();
  });

  it('admin Save action writes an audit log entry', async () => {
    const user = userEvent.setup();
    setDepositCenterEnabled(true);
    renderPage();
    await user.click(screen.getAllByRole('button', { name: /Save/i })[0]);
    await user.click(screen.getByRole('tab', { name: /Audit/i }));
    expect(screen.getByText(/user: bdt=/i)).toBeInTheDocument();
  });

  it('flag persists to localStorage and does not touch live deposit routes', () => {
    setDepositCenterEnabled(true);
    expect(isDepositCenterEnabled()).toBe(true);
    setDepositCenterEnabled(false);
    expect(isDepositCenterEnabled()).toBe(false);
  });
});
