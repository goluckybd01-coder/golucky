import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, ArrowLeft, Copy, Check, LifeBuoy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LuxuryBackground from "@/components/auth-premium/LuxuryBackground";
import LogoMark3D from "@/components/auth-premium/LogoMark3D";

/**
 * Post-OAuth landing page.
 * Supabase parses the URL hash automatically and fires SIGNED_IN.
 * We wait for the session, look up the user's role, then route by role:
 *   super_admin / admin  -> /admin
 *   agent                -> /agent
 *   otherwise            -> /home
 *
 * Any OAuth error (provider denial, bad redirect, session hydration timeout,
 * role lookup failure) is surfaced both to the UI and to the console with a
 * `[AuthCallback]` prefix so developers can diagnose quickly.
 */

type FailureKind =
  | "provider_error"
  | "no_session"
  | "role_lookup_failed"
  | "unexpected";

interface Failure {
  kind: FailureKind;
  title: string;
  detail: string;
  raw?: Record<string, unknown>;
}

const log = (level: "info" | "warn" | "error", msg: string, data?: unknown) => {
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  if (data !== undefined) fn(`[AuthCallback] ${msg}`, data);
  else fn(`[AuthCallback] ${msg}`);
};

/** Read OAuth params from both the hash fragment and the query string. */
const readOAuthParams = () => {
  const hash = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash,
  );
  const search = new URLSearchParams(window.location.search);
  const pick = (k: string) => hash.get(k) ?? search.get(k) ?? undefined;
  return {
    error: pick("error"),
    error_code: pick("error_code"),
    error_description: pick("error_description"),
    provider: pick("provider"),
    hasCode: Boolean(pick("code")),
    hasAccessToken: Boolean(pick("access_token")),
  };
};

const routeForRole = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) {
    log("error", "user_roles lookup failed", error);
    throw error;
  }
  const roles = (data ?? []).map((r) => r.role as string);
  log("info", "roles resolved", roles);
  if (roles.includes("super_admin") || roles.includes("admin")) return "/admin";
  if (roles.includes("agent")) return "/agent";
  return "/home";
};

type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

const validateField = (
  field: "name" | "email" | "message",
  value: string,
): string | undefined => {
  const v = value.trim();
  if (field === "name") {
    if (v.length < 1) return "Name is required.";
    if (v.length > 100) return "Max 100 characters.";
  }
  if (field === "email") {
    if (v.length < 1) return "Email is required.";
    if (v.length > 255) return "Max 255 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email.";
  }
  if (field === "message") {
    if (v.length < 1) return "Message is required.";
    if (v.length > 2000) return "Max 2000 characters.";
  }
  return undefined;
};

const validateAll = (f: { name: string; email: string; message: string }): FieldErrors => ({
  name: validateField("name", f.name),
  email: validateField("email", f.email),
  message: validateField("message", f.message),
});

const AuthCallback = () => {
  const navigate = useNavigate();
  const settled = useRef(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [status, setStatus] = useState("Verifying secure session");
  const [copied, setCopied] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const setField = (k: "name" | "email" | "message", value: string) => {
    setForm((f) => ({ ...f, [k]: value }));
    if (touched[k]) {
      setFieldErrors((e) => ({ ...e, [k]: validateField(k, value) }));
    }
  };
  const blurField = (k: "name" | "email" | "message") => {
    setTouched((t) => ({ ...t, [k]: true }));
    setFieldErrors((e) => ({ ...e, [k]: validateField(k, form[k]) }));
  };

  const isFormValid =
    !validateField("name", form.name) &&
    !validateField("email", form.email) &&
    !validateField("message", form.message);

  const submitReport = async () => {
    if (!failure) return;
    const errs = validateAll(form);
    setTouched({ name: true, email: true, message: true });
    setFieldErrors(errs);
    if (errs.name || errs.email || errs.message) {
      setFormErr("Please fix the highlighted fields.");
      const firstInvalid = (["name", "email", "message"] as const).find((k) => errs[k]);
      const refMap = { name: nameRef, email: emailRef, message: messageRef };
      if (firstInvalid) {
        const el = refMap[firstInvalid].current;
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        // Delay focus slightly so the smooth scroll isn't interrupted by focus jump
        setTimeout(() => el?.focus({ preventScroll: true }), 300);
      }
      return;
    }
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    setFormErr(null);

    setSubmitting(true);
    try {
      const { error } = await supabase.from("auth_error_reports").insert({
        name,
        email,
        message,
        failure_kind: failure.kind,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        diagnostics: JSON.parse(
          JSON.stringify({
            title: failure.title,
            detail: failure.detail,
            raw: failure.raw ?? null,
            timestamp: new Date().toISOString(),
          }),
        ),
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Report sent — support will follow up");
    } catch (err) {
      log("error", "support form submit failed", err);
      const msg = err instanceof Error ? err.message : "Failed to send report.";
      setFormErr(msg);
      toast.error("Could not send report", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };


  const copyDiagnostics = async () => {
    if (!failure) return;
    const payload = {
      kind: failure.kind,
      title: failure.title,
      detail: failure.detail,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      raw: failure.raw ?? null,
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Diagnostics copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      log("error", "clipboard write failed", err);
      toast.error("Could not copy — select the details manually");
    }
  };

  const buildDiagnostics = () => {
    if (!failure) return "";
    return JSON.stringify(
      {
        kind: failure.kind,
        title: failure.title,
        detail: failure.detail,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        raw: failure.raw ?? null,
      },
      null,
      2,
    );
  };

  const sendToSupport = () => {
    if (!failure) return;
    const subject = `GoLucky sign-in error: ${failure.kind}`;
    const body = [
      "Hi GoLucky Support,",
      "",
      "I hit an error while signing in. Diagnostics below:",
      "",
      "----- BEGIN DIAGNOSTICS -----",
      buildDiagnostics(),
      "----- END DIAGNOSTICS -----",
      "",
      "Please help.",
    ].join("\n");
    const href = `mailto:support@goluckybd.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // Try mailto first; if the browser has no mail handler, fall back to copy.
    const win = window.open(href, "_self");
    if (!win) {
      navigator.clipboard.writeText(`${subject}\n\n${body}`).catch(() => {});
      toast.info("No mail app found — diagnostics copied instead", {
        description: "Paste them into a support ticket.",
      });
    } else {
      toast.success("Opening your email app…");
    }
  };

  const fail = (f: Failure) => {
    if (settled.current) return;
    settled.current = true;
    log("error", `failure:${f.kind} — ${f.title}`, { detail: f.detail, raw: f.raw });
    setFailure(f);
    toast.error(f.title, { description: f.detail });
  };

  const succeed = async (userId: string) => {
    if (settled.current) return;
    settled.current = true;
    try {
      setStatus("Loading your dashboard");
      const dest = await routeForRole(userId);
      log("info", "redirecting", { userId, dest });
      toast.success("Welcome to GoLucky 🎉");
      navigate(dest, { replace: true });
    } catch (err) {
      settled.current = false; // allow fail() to fire below
      fail({
        kind: "role_lookup_failed",
        title: "Could not load your account role",
        detail:
          err instanceof Error ? err.message : "Unexpected error reading user_roles.",
        raw: { error: err },
      });
    }
  };

  useEffect(() => {
    // 1) Provider-side error in the URL (?error=access_denied etc.)
    const params = readOAuthParams();
    log("info", "mounted", { url: window.location.href, params });
    if (params.error) {
      fail({
        kind: "provider_error",
        title: `OAuth ${params.error}`,
        detail:
          params.error_description ??
          params.error_code ??
          "Provider returned an error before a session was created.",
        raw: params,
      });
      return;
    }

    // 2) Reactive listener for the OAuth exchange.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      log("info", `auth event: ${event}`, {
        hasSession: Boolean(session),
        userId: session?.user?.id,
      });
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        succeed(session.user.id);
      }
      if (event === "SIGNED_OUT") {
        fail({
          kind: "no_session",
          title: "Session was cleared",
          detail: "Supabase returned SIGNED_OUT before routing completed.",
        });
      }
    });

    // 3) Handle already-hydrated session (e.g. arrived here with a live session).
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          fail({
            kind: "unexpected",
            title: "Failed to read session",
            detail: error.message,
            raw: { error },
          });
          return;
        }
        if (data.session?.user) succeed(data.session.user.id);
      } catch (err) {
        fail({
          kind: "unexpected",
          title: "Unexpected error resolving session",
          detail: err instanceof Error ? err.message : String(err),
          raw: { error: err },
        });
      }
    })();

    // 4) 8s safety timeout — bounce with a diagnostic if nothing happened.
    const timer = window.setTimeout(() => {
      const p = readOAuthParams();
      fail({
        kind: "no_session",
        title: "Sign-in did not complete",
        detail:
          "No session was created within 8 seconds. This usually means the OAuth redirect URL is not on the provider allow-list, or third-party cookies are blocked in this browser.",
        raw: { params: p, url: window.location.href },
      });
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(var(--luxe-black))] flex items-center justify-center px-5">
      <LuxuryBackground />
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full">
        <LogoMark3D />

        {!failure ? (
          <>
            <motion.div
              className="w-10 h-10 rounded-full border-2 border-[hsl(var(--luxe-gold)/0.25)] border-t-[hsl(var(--luxe-gold))]"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <div className="text-center">
              <div className="text-lg font-semibold text-[hsl(var(--luxe-ivory))]">
                Signing you in…
              </div>
              <div className="text-xs text-[hsl(var(--luxe-ivory)/0.55)] mt-1 tracking-wider">
                {status}
              </div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-3xl p-6 border border-[hsl(0_84%_60%/0.35)] bg-[hsl(0_60%_10%/0.35)] backdrop-blur-xl"
            style={{ boxShadow: "0 20px 60px hsl(0 60% 10% / 0.4)" }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-[hsl(0_90%_65%)] shrink-0 mt-0.5" size={22} />
              <div className="flex-1">
                <div className="text-sm font-bold text-[hsl(var(--luxe-ivory))]">
                  {failure.title}
                </div>
                <div className="text-xs text-[hsl(var(--luxe-ivory)/0.7)] mt-1 leading-relaxed">
                  {failure.detail}
                </div>
                <div className="text-[10px] uppercase tracking-widest mt-3 text-[hsl(var(--luxe-ivory)/0.4)]">
                  code: {failure.kind}
                </div>
              </div>
            </div>

            {failure.raw && (
              <details className="mt-3">
                <summary className="text-[11px] text-[hsl(var(--luxe-gold))] cursor-pointer select-none">
                  Diagnostic details
                </summary>
                <pre className="mt-2 text-[10px] leading-snug text-[hsl(var(--luxe-ivory)/0.6)] bg-[hsl(0_0%_0%/0.4)] rounded-xl p-3 overflow-auto max-h-40">
                  {JSON.stringify(failure.raw, null, 2)}
                </pre>
              </details>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  window.history.replaceState(null, "", "/login");
                  navigate("/login", { replace: true });
                }}
                className="flex-1 h-10 rounded-full border border-[hsl(var(--luxe-border))] bg-[hsl(0_0%_100%/0.04)] text-xs font-semibold text-[hsl(var(--luxe-ivory))] hover:bg-[hsl(0_0%_100%/0.08)] transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={13} /> Back
              </button>
              <button
                onClick={copyDiagnostics}
                className="flex-1 h-10 rounded-full border border-[hsl(var(--luxe-border))] bg-[hsl(0_0%_100%/0.04)] text-xs font-semibold text-[hsl(var(--luxe-ivory))] hover:bg-[hsl(0_0%_100%/0.08)] transition-colors inline-flex items-center justify-center gap-1.5"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy diagnostics"}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 h-10 rounded-full text-xs font-bold text-[hsl(var(--luxe-black))] inline-flex items-center justify-center gap-1.5"
                style={{
                  background: "var(--luxe-gradient-primary)",
                  boxShadow: "var(--luxe-glow-button)",
                }}
              >
                <RotateCcw size={13} /> Retry
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={sendToSupport}
                className="h-10 rounded-full border border-[hsl(var(--luxe-gold)/0.35)] bg-[hsl(var(--luxe-gold)/0.08)] text-xs font-semibold text-[hsl(var(--luxe-gold))] hover:bg-[hsl(var(--luxe-gold)/0.14)] transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <LifeBuoy size={13} /> Email support
              </button>
              <button
                onClick={() => setFormOpen((v) => !v)}
                className="h-10 rounded-full border border-[hsl(var(--luxe-gold)/0.35)] bg-[hsl(var(--luxe-gold)/0.08)] text-xs font-semibold text-[hsl(var(--luxe-gold))] hover:bg-[hsl(var(--luxe-gold)/0.14)] transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <LifeBuoy size={13} /> {formOpen ? "Close form" : "Send via form"}
              </button>
            </div>

            {formOpen && (
              <div className="mt-3 rounded-2xl border border-[hsl(var(--luxe-border))] bg-[hsl(0_0%_0%/0.35)] p-3 space-y-2">
                {submitted ? (
                  <div className="text-xs text-[hsl(var(--luxe-ivory))] text-center py-4">
                    ✅ Thanks — we'll email {form.email} shortly.
                  </div>
                ) : (
                  <>
                    {(() => {
                      const refMap = { name: nameRef, email: emailRef, message: messageRef };
                      const labels: Record<"name" | "email" | "message", string> = {
                        name: "Name",
                        email: "Email",
                        message: "Message",
                      };
                      const invalid = (["name", "email", "message"] as const).filter((k) => fieldErrors[k]);
                      if (!formErr || invalid.length === 0) return null;
                      return (
                        <div
                          role="alert"
                          className="rounded-lg border border-[hsl(0_90%_60%/0.4)] bg-[hsl(0_60%_15%/0.35)] p-2.5"
                        >
                          <div className="text-[11px] font-semibold text-[hsl(0_90%_75%)]">
                            Please fix {invalid.length} field{invalid.length > 1 ? "s" : ""}:
                          </div>
                          <ul className="mt-1 space-y-0.5">
                            {invalid.map((k) => (
                              <li key={k} className="text-[10px] text-[hsl(var(--luxe-ivory)/0.75)]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const el = refMap[k].current;
                                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                                    setTimeout(() => el?.focus({ preventScroll: true }), 300);
                                  }}
                                  className="underline underline-offset-2 text-[hsl(var(--luxe-gold))] hover:text-[hsl(var(--luxe-ivory))]"
                                >
                                  {labels[k]}
                                </button>
                                <span className="text-[hsl(var(--luxe-ivory)/0.55)]"> — {fieldErrors[k]}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                    <div>
                      <label htmlFor="diag-name" className="sr-only">Your name</label>
                      <input
                        ref={nameRef}
                        id="diag-name"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        onBlur={() => blurField("name")}
                        placeholder="Your name"
                        maxLength={100}
                        aria-invalid={!!fieldErrors.name}
                        aria-required="true"
                        aria-describedby={fieldErrors.name ? "diag-name-err" : undefined}
                        className={`w-full h-9 rounded-lg bg-[hsl(0_0%_100%/0.04)] border px-3 text-xs text-[hsl(var(--luxe-ivory))] placeholder:text-[hsl(var(--luxe-ivory)/0.35)] outline-none focus:border-[hsl(var(--luxe-gold)/0.5)] ${fieldErrors.name ? "border-[hsl(0_90%_60%)]" : "border-[hsl(var(--luxe-border))]"}`}
                      />
                      {fieldErrors.name && (
                        <div id="diag-name-err" role="alert" aria-live="polite" className="mt-1 text-[10px] text-[hsl(0_90%_70%)]">{fieldErrors.name}</div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="diag-email" className="sr-only">Email</label>
                      <input
                        ref={emailRef}
                        id="diag-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        onBlur={() => blurField("email")}
                        placeholder="Email to reach you"
                        maxLength={255}
                        aria-invalid={!!fieldErrors.email}
                        aria-required="true"
                        aria-describedby={fieldErrors.email ? "diag-email-err" : undefined}
                        className={`w-full h-9 rounded-lg bg-[hsl(0_0%_100%/0.04)] border px-3 text-xs text-[hsl(var(--luxe-ivory))] placeholder:text-[hsl(var(--luxe-ivory)/0.35)] outline-none focus:border-[hsl(var(--luxe-gold)/0.5)] ${fieldErrors.email ? "border-[hsl(0_90%_60%)]" : "border-[hsl(var(--luxe-border))]"}`}
                      />
                      {fieldErrors.email && (
                        <div id="diag-email-err" role="alert" aria-live="polite" className="mt-1 text-[10px] text-[hsl(0_90%_70%)]">{fieldErrors.email}</div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="diag-message" className="sr-only">Message</label>
                      <textarea
                        ref={messageRef}
                        id="diag-message"
                        value={form.message}
                        onChange={(e) => setField("message", e.target.value)}
                        onBlur={() => blurField("message")}
                        placeholder="What happened?"
                        maxLength={2000}
                        rows={3}
                        aria-invalid={!!fieldErrors.message}
                        aria-required="true"
                        aria-describedby={`diag-message-count${fieldErrors.message ? " diag-message-err" : ""}`}
                        className={`w-full rounded-lg bg-[hsl(0_0%_100%/0.04)] border px-3 py-2 text-xs text-[hsl(var(--luxe-ivory))] placeholder:text-[hsl(var(--luxe-ivory)/0.35)] outline-none focus:border-[hsl(var(--luxe-gold)/0.5)] resize-none ${fieldErrors.message ? "border-[hsl(0_90%_60%)]" : "border-[hsl(var(--luxe-border))]"}`}
                      />
                      <div className="mt-1 flex justify-between text-[10px]">
                        <span id="diag-message-err" role="alert" aria-live="polite" className="text-[hsl(0_90%_70%)]">{fieldErrors.message ?? ""}</span>
                        <span id="diag-message-count" className="text-[hsl(var(--luxe-ivory)/0.4)]">{form.message.trim().length}/2000</span>
                      </div>
                    </div>
                    {formErr && (
                      <div role="alert" aria-live="assertive" className="text-[11px] text-[hsl(0_90%_70%)]">{formErr}</div>
                    )}
                    <button
                      onClick={submitReport}
                      disabled={submitting || !isFormValid}
                      className="w-full h-9 rounded-full text-xs font-bold text-[hsl(var(--luxe-black))] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      style={{
                        background: "var(--luxe-gradient-primary)",
                        boxShadow: "var(--luxe-glow-button)",
                      }}
                    >
                      {submitting && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      )}
                      {submitting ? "Sending…" : "Submit report + diagnostics"}
                    </button>
                    <p className="text-[10px] text-[hsl(var(--luxe-ivory)/0.4)] leading-snug">
                      We'll attach the failure kind, URL, browser info, and raw diagnostic
                      payload automatically.
                    </p>
                  </>
                )}
              </div>
            )}

            <p className="text-[10px] text-[hsl(var(--luxe-ivory)/0.4)] mt-3">
              Open the browser console for the full <code>[AuthCallback]</code> trace.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
