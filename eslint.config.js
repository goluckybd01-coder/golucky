import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message: "Hardcoded hex color. Use a palette token (NEON_GOLD/GREEN/BLUE/PURPLE, GOLD_*) or hsl(var(--token)).",
        },
        {
          selector: "TemplateElement[value.raw=/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]",
          message: "Hardcoded hex color in template literal. Interpolate a palette token instead (${NEON_GOLD}).",
        },
        {
          selector: "Literal[value=/\\b(?:rgb|rgba|hsl|hsla)\\s*\\(/]",
          message: "Hardcoded rgb/hsl color. Use a palette token or hsl(var(--token)).",
        },
        {
          selector: "TemplateElement[value.raw=/\\b(?:rgb|hsl)a?\\s*\\(\\s*\\d/]",
          message: "Hardcoded rgb/hsl color in template literal. Use a palette token or hsl(var(--token)).",
        },
      ],
    },
  },
  {
    files: [
      "src/pages/HomeMobile.tsx",
      "src/pages/HomeDesktop.tsx",
      "src/index.css",
      "tailwind.config.{ts,js}",
      "**/theme/**/*.{ts,tsx}",
      "**/tokens/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: [
      "src/components/**/charts/**/*.{ts,tsx}",
      "src/pages/admin/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["supabase/functions/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
