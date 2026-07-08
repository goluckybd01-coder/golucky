import { ExternalLink, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBadgeConfig } from "@/lib/badgeConfig";

/**
 * Live status badge for the Footer Links E2E workflow.
 * Repo/workflow can come from build-time env vars OR the in-app
 * badge settings screen (/settings/badges). Falls back to a small
 * "Configure" chip that links to the settings screen.
 */
export function CiStatusBadge({ className = "" }: { className?: string }) {
  const [cfg, setCfg] = useState(() => getBadgeConfig());

  useEffect(() => {
    const handler = () => setCfg(getBadgeConfig());
    window.addEventListener("badge-config-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("badge-config-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const { githubRepo, workflowFile, runsUrlOverride } = cfg;

  if (!githubRepo && !runsUrlOverride) {
    return (
      <Link
        to="/settings/badges"
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/60 hover:bg-white/10 transition ${className}`}
        title="Configure the CI status badge"
      >
        <Settings2 className="h-3 w-3" /> Configure CI badge
      </Link>
    );
  }

  const badge = githubRepo
    ? `https://github.com/${githubRepo}/actions/workflows/${workflowFile}/badge.svg`
    : "";
  const runs =
    runsUrlOverride ||
    `https://github.com/${githubRepo}/actions/workflows/${workflowFile}`;

  return (
    <a
      href={runs}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-1 hover:bg-white/5 transition ${className}`}
      title="Open latest workflow run"
    >
      {badge ? (
        <img src={badge} alt="CI status" className="h-4" loading="lazy" />
      ) : (
        <span className="text-[10px] text-white/70">CI</span>
      )}
      <ExternalLink className="h-3 w-3 text-white/50" />
    </a>
  );
}
