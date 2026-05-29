import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
    env: {
      // email.ts instantiates Resend at module load; a dummy key prevents a throw
      // during unit tests (no emails are actually sent under test).
      RESEND_API_KEY: "re_test_dummy",
    },
  },
});
