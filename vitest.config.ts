import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.{js,ts}"],
    exclude: ["src/tests/integration/**", "src/extension.ts", "src/sample.ts", "node_modules", "dist"],
    includeSource: ["src/**/*.{js,ts}"],
  },
});
