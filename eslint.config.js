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
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Prevent direct console.* usage - use logger utility instead
      // Exception: logger.ts is allowed to use console.*
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // Allow console.* in logger utility (it wraps console calls)
  {
    files: ["**/utils/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  // Allow console.* in e2e test files for debugging
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  }
);
