import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";
import { z } from "zod";
import { getBadgeConfig, saveBadgeConfig, resetBadgeConfig } from "@/lib/badgeConfig";
import { CiStatusBadge } from "@/components/status/CiStatusBadge";
import { toast } from "sonner";

const badgeSchema = z.object({
  githubRepo: z
    .string()
    .trim()
    .max(120, "Repo must be under 120 characters")
    .refine(
      (v) => v === "" || /^[\w.-]+\/[\w.-]+$/.test(v),
      "Must be in the form owner/repo (letters, numbers, . _ -)",
    ),
  workflowFile: z
    .string()
    .trim()
    .max(120, "Workflow file name is too long")
    .refine(
      (v) => v === "" || /^[\w.-]+\.ya?ml$/.test(v),
      "Must be a .yml or .yaml file name",
    ),
  runsUrlOverride: z
    .preprocess((raw) => {
      if (typeof raw !== "string") return raw;
      const trimmed = raw.trim();
      if (trimmed === "") return "";
      // Reject any non-https explicit protocol; normalize protocol-less inputs.
      const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
      const candidate = hasProtocol ? trimmed : `https://${trimmed}`;
      try {
        const u = new URL(candidate);
        if (u.protocol !== "https:") return trimmed; // let refine reject
        if (!u.hostname || !u.hostname.includes(".")) return trimmed;
        return u.toString();
      } catch {
        return trimmed;
      }
    }, z
      .string()
      .max(500, "URL is too long")
      .refine((v) => {
        if (v === "") return true;
        try {
          const u = new URL(v);
          return u.protocol === "https:" && !!u.hostname && u.hostname.includes(".");
        } catch {
          return false;
        }
      }, "Must be a valid https:// URL")),
});

type FieldErrors = Partial<Record<"githubRepo" | "workflowFile" | "runsUrlOverride", string>>;

export default function BadgeSettings() {
  const [cfg, setCfg] = useState(() => getBadgeConfig());
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => setCfg(getBadgeConfig()), []);

  const set = <K extends keyof typeof cfg>(k: K, v: (typeof cfg)[K]) => {
    setCfg((c) => ({ ...c, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const liveParse = badgeSchema.safeParse({
    githubRepo: cfg.githubRepo,
    workflowFile: cfg.workflowFile,
    runsUrlOverride: cfg.runsUrlOverride ?? "",
  });
  const hasRepoOrUrl = liveParse.success
    ? !!(liveParse.data.githubRepo || liveParse.data.runsUrlOverride)
    : false;
  const canSave = liveParse.success && hasRepoOrUrl;

  const liveErrors: FieldErrors = {};
  if (!liveParse.success) {
    for (const issue of liveParse.error.issues) {
      const key = issue.path[0] as keyof FieldErrors;
      if (key && !liveErrors[key]) liveErrors[key] = issue.message;
    }
  }
  const shownErrors: FieldErrors = { ...liveErrors };
  for (const [k, v] of Object.entries(errors)) {
    if (v) shownErrors[k as keyof FieldErrors] = v;
  }

  const onSave = () => {
    const parsed = badgeSchema.safeParse({
      githubRepo: cfg.githubRepo,
      workflowFile: cfg.workflowFile,
      runsUrlOverride: cfg.runsUrlOverride ?? "",
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (!parsed.data.githubRepo && !parsed.data.runsUrlOverride) {
      setErrors({ githubRepo: "Provide a repo or a runs URL override" });
      toast.error("Provide either a GitHub repo or a runs URL override");
      return;
    }
    saveBadgeConfig({
      githubRepo: parsed.data.githubRepo,
      workflowFile: parsed.data.workflowFile || "footer-links-e2e.yml",
      runsUrlOverride: parsed.data.runsUrlOverride,
    });
    setErrors({});
    toast.success("Badge settings saved");
  };

  const onReset = () => {
    resetBadgeConfig();
    setCfg(getBadgeConfig());
    setErrors({});
    toast.success("Reverted to build-time defaults");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-6">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="rounded-full border border-white/10 p-2 hover:bg-white/5">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-semibold">Status badges</h1>
        </div>

        <p className="text-sm text-white/60">
          Configure where the in-app CI status badge points. These values are
          stored on this device and override the build-time environment
          variables.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="bs-repo" className="text-xs uppercase tracking-wide text-white/50">
              GitHub repo (owner/repo)
            </label>
            <input
              id="bs-repo"
              value={cfg.githubRepo}
              onChange={(e) => set("githubRepo", e.target.value)}
              placeholder="my-org/golucky"
              aria-invalid={!!shownErrors.githubRepo}
              aria-describedby={shownErrors.githubRepo ? "bs-repo-err" : undefined}
              className={`w-full rounded-lg border bg-black/40 px-3 py-2 text-sm outline-none ${
                shownErrors.githubRepo
                  ? "border-red-500/70 focus:border-red-400"
                  : "border-white/10 focus:border-emerald-400/60"
              }`}
            />
            {shownErrors.githubRepo && (
              <p id="bs-repo-err" className="text-[11px] text-red-400">
                {shownErrors.githubRepo}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bs-wf" className="text-xs uppercase tracking-wide text-white/50">
              Workflow file
            </label>
            <input
              id="bs-wf"
              value={cfg.workflowFile}
              onChange={(e) => set("workflowFile", e.target.value)}
              placeholder="footer-links-e2e.yml"
              aria-invalid={!!shownErrors.workflowFile}
              aria-describedby={shownErrors.workflowFile ? "bs-wf-err" : undefined}
              className={`w-full rounded-lg border bg-black/40 px-3 py-2 text-sm outline-none ${
                shownErrors.workflowFile
                  ? "border-red-500/70 focus:border-red-400"
                  : "border-white/10 focus:border-emerald-400/60"
              }`}
            />
            {shownErrors.workflowFile && (
              <p id="bs-wf-err" className="text-[11px] text-red-400">
                {shownErrors.workflowFile}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bs-url" className="text-xs uppercase tracking-wide text-white/50">
              Runs URL override (optional)
            </label>
            <input
              id="bs-url"
              value={cfg.runsUrlOverride ?? ""}
              onChange={(e) => set("runsUrlOverride", e.target.value)}
              placeholder="https://…"
              aria-invalid={!!shownErrors.runsUrlOverride}
              aria-describedby={shownErrors.runsUrlOverride ? "bs-url-err" : "bs-url-help"}
              className={`w-full rounded-lg border bg-black/40 px-3 py-2 text-sm outline-none ${
                shownErrors.runsUrlOverride
                  ? "border-red-500/70 focus:border-red-400"
                  : "border-white/10 focus:border-emerald-400/60"
              }`}
            />
            {shownErrors.runsUrlOverride ? (
              <p id="bs-url-err" className="text-[11px] text-red-400">
                {shownErrors.runsUrlOverride}
              </p>
            ) : (
              <p id="bs-url-help" className="text-[11px] text-white/40">
                Use this if your CI runs on a different host or you want a custom
                landing URL.
              </p>
            )}
          </div>


          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              onClick={onSave}
              aria-disabled={!canSave}
              className={`inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 ${
                !canSave ? "cursor-not-allowed opacity-50 hover:bg-emerald-500/90" : ""
              }`}
            >
              <Save className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-xs uppercase tracking-wide text-white/50">
            Live preview
          </div>
          <CiStatusBadge />
        </div>
      </div>
    </div>
  );
}
