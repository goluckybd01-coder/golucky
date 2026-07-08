/**
 * AdminTotpGate — post-password 2FA step for admin login.
 */
import { useEffect, useState } from 'react';
import { Loader2, Shield, KeyRound, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  totpStatus,
  totpEnroll,
  totpConfirmEnroll,
  totpVerify,
} from '@/lib/adminTotp';
import { signOutAdmin } from '@/lib/adminAuthStore';

interface Props {
  onComplete: () => void;
  onCancel?: () => void;
}

type Mode = 'loading' | 'enroll' | 'verify' | 'done';

function qrUrl(otpauth: string) {
  const encoded = encodeURIComponent(otpauth);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
}

export const AdminTotpGate = ({ onComplete, onCancel }: Props) => {
  const [mode, setMode] = useState<Mode>('loading');
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [base32, setBase32] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await totpStatus();
        if (!s.required && !s.totpEnabled) {
          setMode('done');
          onComplete();
          return;
        }
        if (s.totpEnabled) {
          setMode('verify');
        } else {
          const enroll = await totpEnroll();
          setOtpauth(enroll.otpauth);
          setBase32(enroll.base32);
          setMode('enroll');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load 2FA status');
        setMode('verify');
      }
    })();
  }, [onComplete]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your authenticator app');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'enroll') {
        await totpConfirmEnroll(code);
        toast({ title: '2FA enabled', description: 'Save the recovery secret somewhere safe.' });
      } else {
        await totpVerify(code);
      }
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    await signOutAdmin();
    onCancel?.();
  };

  if (mode === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <p className="text-sm text-slate-400">Preparing 2FA…</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-2">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
        <p className="text-xs text-slate-400 mt-1">
          {mode === 'enroll'
            ? 'Scan this QR in Google Authenticator, Authy, or 1Password, then enter the 6-digit code.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </p>
      </div>

      {mode === 'enroll' && otpauth && (
        <div className="rounded-lg bg-slate-900/60 border border-slate-700/50 p-3 flex flex-col items-center gap-2">
          <img src={qrUrl(otpauth)} alt="TOTP QR code" className="w-44 h-44 rounded-md bg-white p-1" />
          {base32 && <code className="text-[11px] text-slate-300 break-all text-center">{base32}</code>}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="totp-code" className="text-slate-300">Authentication code</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            id="totp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="pl-10 tracking-widest text-center text-lg"
            autoFocus
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={cancel} className="flex-1">
          <LogOut className="w-4 h-4 mr-2" /> Cancel
        </Button>
        <Button type="submit" disabled={busy || code.length !== 6} className="flex-1">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'enroll' ? 'Enable 2FA' : 'Verify'}
        </Button>
      </div>
    </form>
  );
};

export default AdminTotpGate;
