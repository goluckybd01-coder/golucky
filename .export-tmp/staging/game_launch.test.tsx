import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/lib/bannerConfig", () => ({
  isAdminAuthenticated: () => true,
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: any[]) => toastError(...args),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

let signupsError: any = null;

let signupsData: any[] = [];
let profilesData: any[] = [];
let signupsResolver: ((v: any) => void) | null = null;

vi.mock("@/integrations/supabase/client", () => {
  const from = vi.fn((table: string) => {
    if (table === "game_launch_notifications") {
      return {
        select: () => ({
          order: () =>
            signupsResolver
              ? new Promise((resolve) => {
                  signupsResolver = resolve;
                })
              : Promise.resolve({ data: signupsError ? null : signupsData, error: signupsError }),
        }),
      };
    }
    if (table === "profiles") {
      return {
        select: () => ({
          in: () => Promise.resolve({ data: profilesData, error: null }),
        }),
      };
    }
    return { select: () => ({}) };
  });
  return { supabase: { from } };
});

import GameLaunchNotifications from "../GameLaunchNotifications";

beforeEach(() => {
  signupsData = [];
  profilesData = [];
  vi.clearAllMocks();
});

beforeEach(() => {
  signupsResolver = null;
  signupsError = null;
});

describe("GameLaunchNotifications error state", () => {
  it("shows the empty error state and toasts the exact message after the spinner disappears", async () => {
    signupsError = { message: "boom", code: "500" };

    const { container } = render(<GameLaunchNotifications />);

    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(toastError).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(
        screen.getByText("No notification signups found"),
      ).toBeInTheDocument(),
    );
    expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();

    expect(toastError).toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Failed to load notification signups");
    for (const call of toastError.mock.calls) {
      expect(call).toHaveLength(1);
      expect(call[0]).toBe("Failed to load notification signups");
    }
  });
});

describe("GameLaunchNotifications rendering", () => {
  it("shows a loading spinner while notifications are being fetched", async () => {
    signupsResolver = () => {};
    const { container } = render(<GameLaunchNotifications />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText("Total Subscribers")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No notification signups found"),
    ).not.toBeInTheDocument();
  });

  it("renders a row per signup using mapper output (username + phone + status)", async () => {
    signupsData = [
      {
        id: "s1",
        user_id: "u1",
        category_id: "slots",
        category_name: "Slots",
        created_at: "2026-01-15T10:00:00Z",
        notified_at: null,
      },
      {
        id: "s2",
        user_id: "u2",
        category_id: "casino",
        category_name: "Casino",
        created_at: "2026-01-16T11:00:00Z",
        notified_at: "2026-01-17T12:00:00Z",
      },
    ];
    profilesData = [
      { user_id: "u1", username: "alice", phone: "017000001" },
      { user_id: "u2", username: "bob", phone: "017000002" },
    ];

    render(<GameLaunchNotifications />);
    await waitFor(() => expect(screen.getByText("alice")).toBeInTheDocument());

    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByText("017000001")).toBeInTheDocument();
    expect(screen.getByText("017000002")).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Notified").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Slots").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Casino").length).toBeGreaterThan(0);
  });

  it("does not expose an email field anywhere in the rendered table", async () => {
    signupsData = [
      {
        id: "s1",
        user_id: "u1",
        category_id: "slots",
        category_name: "Slots",
        created_at: "2026-01-15T10:00:00Z",
        notified_at: null,
      },
    ];
    profilesData = [{ user_id: "u1", username: "alice", phone: "017000001" }];

    const { container } = render(<GameLaunchNotifications />);
    await waitFor(() => expect(screen.getByText("alice")).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/@/);
  });

  it("renders an empty-state row when there are no signups", async () => {
    signupsData = [];
    profilesData = [];

    render(<GameLaunchNotifications />);
    await waitFor(() =>
      expect(
        screen.getByText("No notification signups found"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Total Subscribers")).toBeInTheDocument();
  });

  it("falls back to Anonymous + user_id slice when profile is missing", async () => {
    signupsData = [
      {
        id: "s1",
        user_id: "abcdef1234567890",
        category_id: "slots",
        category_name: "Slots",
        created_at: "2026-01-15T10:00:00Z",
        notified_at: null,
      },
    ];
    profilesData = [];

    render(<GameLaunchNotifications />);
    await waitFor(() =>
      expect(screen.getByText("Anonymous")).toBeInTheDocument(),
    );
    expect(screen.getByText("abcdef12")).toBeInTheDocument();
  });

  it("handles profiles with null username/phone gracefully", async () => {
    signupsData = [
      {
        id: "s1",
        user_id: "u1",
        category_id: "slots",
        category_name: "Slots",
        created_at: "2026-01-15T10:00:00Z",
        notified_at: null,
      },
    ];
    profilesData = [{ user_id: "u1", username: null, phone: null }];

    render(<GameLaunchNotifications />);
    await waitFor(() =>
      expect(screen.getByText("Anonymous")).toBeInTheDocument(),
    );
    expect(screen.getByText("u1".slice(0, 8))).toBeInTheDocument();
  });
});
