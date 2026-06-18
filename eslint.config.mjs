import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "prefer-const": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local/private and generated tooling folders
    "private/**",
    "scratch/**",
    "scripts/**",
    // The Hardhat contracts project is a standalone Node sub-project with its
    // own tooling/tests (CommonJS `require`); it isn't part of the Next app.
    "contracts/**",
  ]),
]);

export default eslintConfig;
