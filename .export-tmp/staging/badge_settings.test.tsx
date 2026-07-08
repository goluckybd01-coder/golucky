import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BadgeSettings from "@/pages/settings/BadgeSettings";
import { getBadgeConfig } from "@/lib/badgeConfig";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <BadgeSettings />
    </MemoryRouter>
  );
}

describe("BadgeSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves valid repo config to localStorage", async () => {
    renderPage();
    const repoInput = screen.getByPlaceholderText("my-org/golucky");
    fireEvent.change(repoInput, { target: { value: "acme/app" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(getBadgeConfig().githubRepo).toBe("acme/app");
  });

  it("rejects invalid repo format", async () => {
    const { toast } = await import("sonner");
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("my-org/golucky"), {
      target: { value: "not-a-repo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(toast.error).toHaveBeenCalled();
    expect(getBadgeConfig().githubRepo).toBe("");
  });

  it("reset clears stored config", () => {
    localStorage.setItem(
      "gl.badgeConfig.v1",
      JSON.stringify({ githubRepo: "acme/app", workflowFile: "ci.yml" })
    );
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(getBadgeConfig().githubRepo).toBe("");
  });

  describe("validation errors", () => {
    it("shows inline error for invalid repo format", () => {
      renderPage();
      const input = screen.getByPlaceholderText("my-org/golucky");
      fireEvent.change(input, { target: { value: "not-a-repo" } });
      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      expect(screen.getByText(/Must be in the form/i)).toBeInTheDocument();
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("shows inline error for invalid workflow filename", () => {
      renderPage();
      fireEvent.change(screen.getByPlaceholderText("my-org/golucky"), {
        target: { value: "acme/app" },
      });
      const wf = screen.getByPlaceholderText("footer-links-e2e.yml");
      fireEvent.change(wf, { target: { value: "ci.txt" } });
      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      expect(screen.getByText(/\.yml or \.yaml/i)).toBeInTheDocument();
      expect(wf).toHaveAttribute("aria-invalid", "true");
    });

    it("shows inline error for invalid URL override", () => {
      renderPage();
      fireEvent.change(screen.getByPlaceholderText("my-org/golucky"), {
        target: { value: "acme/app" },
      });
      const url = screen.getByPlaceholderText("https://…");
      fireEvent.change(url, { target: { value: "not a url" } });
      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      expect(screen.getByText(/valid https/i)).toBeInTheDocument();
      expect(url).toHaveAttribute("aria-invalid", "true");
    });

    it("requires at least a repo or a runs URL override", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
      expect(screen.getByText(/Provide a repo or a runs URL/i)).toBeInTheDocument();
      expect(getBadgeConfig().githubRepo).toBe("");
    });

    it("clears the field error when the user edits the value", () => {
      renderPage();
      const input = screen.getByPlaceholderText("my-org/golucky");
      fireEvent.change(input, { target: { value: "bad" } });
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
      expect(screen.getByText(/Must be in the form/i)).toBeInTheDocument();

      fireEvent.change(input, { target: { value: "acme/app" } });
      expect(screen.queryByText(/Must be in the form/i)).not.toBeInTheDocument();
      expect(input).toHaveAttribute("aria-invalid", "false");
    });

    it("accepts a valid https URL override without a repo", () => {
      renderPage();
      const url = screen.getByPlaceholderText("https://…");
      fireEvent.change(url, { target: { value: "https://ci.example.com/runs" } });
      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      expect(getBadgeConfig().runsUrlOverride).toBe("https://ci.example.com/runs");
    });
  });
});
