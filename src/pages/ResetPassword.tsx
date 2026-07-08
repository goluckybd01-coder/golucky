import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(72, { message: "Password must be 72 characters or fewer" })
      .regex(/[A-Z]/, { message: "Must include an uppercase letter" })
      .regex(/[a-z]/, { message: "Must include a lowercase letter" })
      .regex(/[0-9]/, { message: "Must include a number" }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FieldErrors = { newPassword?: string; confirmPassword?: string };

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);



  const [touched, setTouched] = useState<{ newPassword: boolean; confirmPassword: boolean }>({
    newPassword: false,
    confirmPassword: false,
  });

  const errors: FieldErrors = useMemo(() => {
    const result = passwordSchema.safeParse({ newPassword, confirmPassword });
    if (result.success) return {};
    const fe: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof FieldErrors;
      if (key && !fe[key]) fe[key] = issue.message;
    }
    return fe;
  }, [newPassword, confirmPassword]);

  const showNewErr = touched.newPassword && errors.newPassword;
  const showConfirmErr = touched.confirmPassword && errors.confirmPassword;
  const isValid = !errors.newPassword && !errors.confirmPassword;

  // Supabase parses the recovery hash on load and emits PASSWORD_RECOVERY
  useEffect(() => {
    // Detect invalid/expired recovery links via hash error params
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const params = new URLSearchParams(hash);
    const errCode = params.get("error_code") || params.get("error");
    const errDesc = params.get("error_description");
    if (errCode || errDesc) {
      const decoded = (errDesc || "").replace(/\+/g, " ");
      const isExpired = /expired|otp_expired/i.test(errCode || "") || /expired/i.test(decoded);
      setLinkError(
        isExpired
          ? "This password reset link has expired. Request a new one and try again."
          : decoded || "This password reset link is invalid. Request a new one and try again."
      );
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ newPassword: true, confirmPassword: true });
    const parsed = passwordSchema.safeParse({ newPassword, confirmPassword });
    if (!parsed.success) {
      toast({
        title: "Please fix the errors",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
    toast({ title: "Password updated", description: "You can now sign in with your new password." });
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/login")}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          aria-label="Back to login"
        >
          <ArrowLeft className="text-white" size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Set a new password</h1>
      </header>

      <main className="max-w-md mx-auto p-6">
        {done ? (
          <div className="text-center space-y-3 py-10">
            <CheckCircle className="mx-auto text-green-500" size={56} />
            <h2 className="text-2xl font-bold">Password updated</h2>
            <p className="text-gray-600">Redirecting you to sign in…</p>
          </div>
        ) : linkError ? (
          <div
            role="alert"
            aria-live="assertive"
            data-testid="reset-link-error"
            className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium">{linkError}</p>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-800"
                >
                  Request a new reset link
                </button>
              </div>
            </div>
          </div>
        ) : !ready ? (
          <p className="text-center text-gray-600 py-10">
            Validating your reset link… If this stays here, open the link from your email again.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <label className="block">
              <span className="text-sm font-medium">New password</span>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, newPassword: true }))}
                  placeholder="Min 8 chars, upper, lower, number"
                  className="pl-10"
                  autoComplete="new-password"
                  aria-invalid={!!showNewErr}
                  aria-describedby="new-password-error"
                  required
                />
              </div>
              {showNewErr && (
                <p id="new-password-error" className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={14} /> {errors.newPassword}
                </p>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-medium">Confirm password</span>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                  placeholder="Re-enter password"
                  className="pl-10"
                  autoComplete="new-password"
                  aria-invalid={!!showConfirmErr}
                  aria-describedby="confirm-password-error"
                  required
                />
              </div>
              {showConfirmErr && (
                <p id="confirm-password-error" className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={14} /> {errors.confirmPassword}
                </p>
              )}
            </label>
            <Button type="submit" disabled={isLoading || !isValid} className="w-full">
              {isLoading ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
};

export default ResetPassword;
