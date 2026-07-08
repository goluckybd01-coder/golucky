import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CiStatusBadge } from "@/components/status/CiStatusBadge";
import { saveBadgeConfig, resetBadgeConfig } from "@/lib/badgeConfig";

function renderBadge() {
  return render(
    <MemoryRouter>
      <CiStatusBadge />
    </MemoryRouter>
  );
}

describe("CiStatusBadge", () => {
  beforeEach(() => {
    localStorage.clear();
    resetBadgeConfig();
  });

  it("renders a Configure link when unconfigured", () => {
    renderBadge();
    const link = screen.getByRole("link", { name: /configure ci badge/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/settings/badges");
  });

  it("renders the badge image and runs link when configured", () => {
    saveBadgeConfig({ githubRepo: "acme/app", workflowFile: "ci.yml" });
    renderBadge();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/acme/app/actions/workflows/ci.yml"
    );
    const img = screen.getByAltText(/ci status/i) as HTMLImageElement;
    expect(img.src).toBe(
      "https://github.com/acme/app/actions/workflows/ci.yml/badge.svg"
    );
  });

  it("honors runsUrlOverride", () => {
    saveBadgeConfig({
      githubRepo: "acme/app",
      workflowFile: "ci.yml",
      runsUrlOverride: "https://ci.example.com/runs",
    });
    renderBadge();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://ci.example.com/runs"
    );
  });
});
