import { defineConfig } from 'vitest/config';

// Unit tests live next to the code under src/. The Hardhat contract tests in
// contracts/ run under Hardhat/mocha, not vitest, so they're excluded.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
