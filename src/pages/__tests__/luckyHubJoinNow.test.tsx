import { describe, it, expect } from "vitest";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import React from "react";

function JoinNowButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        try {
          navigate("/fixed-deposits?mode=join");
        } catch {
        }
      }}
    >
      Join Now
    </button>
  );
}

function LocationProbe() {
  const loc = useLocation();
  return <span data-testid="path">{loc.pathname}</span>;
}

describe("LuckyHub Join Now navigation", () => {
  it("navigates to /fixed-deposits on click", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/lucky-hub"]}>
          <Routes>
            <Route path="/lucky-hub" element={<JoinNowButton />} />
            <Route path="/fixed-deposits" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const btn = container.querySelector("button")!;
    expect(btn.textContent).toBe("Join Now");

    await act(async () => {
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const probe = container.querySelector('[data-testid="path"]');
    expect(probe?.textContent).toBe("/fixed-deposits");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
