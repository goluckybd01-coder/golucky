import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const schema = z.object({
  email: z.string().trim().email("Valid email required").max(255),
});

export function AssignSuperAdminForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFoundEmail, setNotFoundEmail] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string; bootstrap: boolean } | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const validate = (value: string) => {
    const result = schema.safeParse({ email: value });
    return result.success ? null : result.error.issues[0].message;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(email);
    if (err) {
      setEmailError(err);
      return;
    }
    const parsed = schema.safeParse({ email });
    if (!parsed.success) return;
    setLoading(true);
    setNotFoundEmail(null);
    setSuccess(null);
    setRequestError(null);
    try {
      const { data, error } = await supabase.rpc("assign_super_admin_by_email", {
        p_email: parsed.data.email,
      });
      if (error) throw error;
      const res = data as { success: boolean; error?: string; bootstrap?: boolean };
      if (!res?.success) {
        const msg = res?.error ?? "Failed to assign role";
        if (/not\s*found|no\s*user|does\s*not\s*exist/i.test(msg)) {
          setNotFoundEmail(parsed.data.email);
        } else {
          setRequestError(msg);
        }
        toast.error(msg);
        return;
      }
      toast.success(
        res.bootstrap
          ? `${parsed.data.email} bootstrapped as super_admin`
          : `${parsed.data.email} is now a super_admin`
      );
      setSuccess({ email: parsed.data.email, bootstrap: !!res.bootstrap });
      setEmail("");
    } catch (err: any) {
      const msg = err?.message ?? "Unexpected error. Please try again.";
      setRequestError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-500" />
          Assign Super Admin
        </CardTitle>
        <CardDescription>
          Grant the <strong>super_admin</strong> role to an existing registered user by email.
          The user must have signed up first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="sa-email">User email</Label>
            <Input
              id="sa-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => {
                const v = e.target.value;
                setEmail(v);
                if (notFoundEmail) setNotFoundEmail(null);
                if (success) setSuccess(null);
                if (requestError) setRequestError(null);
                if (emailError) setEmailError(v.trim() ? validate(v) : null);
              }}
              onBlur={() => {
                if (email.trim()) setEmailError(validate(email));
              }}
              disabled={loading}
              autoComplete="off"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "sa-email-error" : undefined}
              required
            />
            {emailError && (
              <p id="sa-email-error" className="text-xs text-destructive">
                {emailError}
              </p>
            )}
          </div>
          <Button type="submit" disabled={loading || !email} className="sm:w-44">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning…
              </>
            ) : (
              "Assign super_admin"
            )}
          </Button>
        </form>
        {requestError && !notFoundEmail && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Assignment failed</AlertTitle>
            <AlertDescription>
              {requestError} You can edit the email and try again.
            </AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mt-4 border-emerald-500/40 bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <AlertTitle className="text-emerald-600 dark:text-emerald-400">
              Super admin assigned
            </AlertTitle>
            <AlertDescription>
              <strong>{success.email}</strong>{" "}
              {success.bootstrap
                ? "has been bootstrapped as the first super_admin."
                : "now has the super_admin role and full admin access."}
            </AlertDescription>
          </Alert>
        )}
        {notFoundEmail && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>User not found</AlertTitle>
            <AlertDescription>
              No registered account exists for <strong>{notFoundEmail}</strong>. Ask the user to
              sign up first on the registration page, then return here and assign the
              <strong> super_admin</strong> role.
              <div className="mt-3">
                <Link
                  to={`/register?email=${encodeURIComponent(notFoundEmail)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-amber-400"
                >
                  Register now →
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
