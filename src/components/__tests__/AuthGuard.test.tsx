import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({}),
    },
  },
}));

import AuthGuard from "../AuthGuard";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<AuthGuard><div>child</div></AuthGuard>} />
      </Routes>
    </MemoryRouter>
  );

describe("AuthGuard protected routes (unauthenticated)", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("redirects /home to /login", async () => {
    renderAt("/home");
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true })
    );
  });
});
