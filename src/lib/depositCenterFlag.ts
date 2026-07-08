import { useEffect, useState } from 'react';

const KEY = 'deposit_center_enabled';

export function isDepositCenterEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(KEY) === '1';
}

export function setDepositCenterEnabled(v: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, v ? '1' : '0');
  window.dispatchEvent(new CustomEvent('deposit-center-flag-changed', { detail: v }));
}

export function useDepositCenterFlag(): [boolean, (v: boolean) => void] {
  const [flag, setFlag] = useState<boolean>(isDepositCenterEnabled());
  useEffect(() => {
    const onChange = () => setFlag(isDepositCenterEnabled());
    window.addEventListener('deposit-center-flag-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('deposit-center-flag-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);
  return [flag, setDepositCenterEnabled];
}
