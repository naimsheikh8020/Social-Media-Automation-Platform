// vitest.config.ts
import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  test: {
    env: { NODE_ENV: "test" }, 

    setupFiles: ["./tests/setup.ts"],
    environment: "node",
    disableConsoleIntercept: true,

    testTimeout: 120000, // 2 minutes for tests to run
    hookTimeout: 120000, // 2 minutes for setup.ts (beforeAll) to finish downloading
  },
});
