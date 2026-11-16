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
    testTimeout: 120000,
    hookTimeout: 120000,
    exclude: ["**/node_modules/**", "**/dist/**"],
    
    // 👇 Vitest 4 Fix: Use maxWorkers instead of poolOptions
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false, 
  },
});