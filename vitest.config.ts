import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Ensure JUnit XML includes `file` (and line via failure stack) so PR
    // annotations from mikepenz/action-junit-report point to exact source lines.
    reporters: process.env.CI
      ? [
          "default",
          [
            "junit",
            {
              outputFile: "./reports/junit.xml",
              suiteName: "GoLucky Unit Tests",
              classnameTemplate: "{filepath}",
              addFileAttribute: "true",
              includeConsoleOutput: true,
            },
          ],
        ]
      : ["default"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
