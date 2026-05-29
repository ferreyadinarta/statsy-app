import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Redirect the real email module to a no-op stub so Resend is never
      // instantiated during unit tests (it throws without RESEND_API_KEY).
      "@/lib/email": path.resolve(__dirname, "./src/lib/email.stub.ts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
  },
});
