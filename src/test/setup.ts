import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Neutralise react-helmet-async in tests — no HelmetProvider needed in render helpers.
vi.mock("react-helmet-async", () => ({
  Helmet: () => null,
  HelmetProvider: ({ children }: { children?: React.ReactNode }) => children,
}));
