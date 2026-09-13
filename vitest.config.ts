import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests target pure logic and server-action guards — no DOM needed,
// so the default node environment is fine. The `@` alias mirrors
// tsconfig.json paths so tests import the same way app code does.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only`/`client-only` throw when imported outside their
      // runtime; stub them so server modules are unit-testable in Node.
      "server-only": fileURLToPath(new URL("./src/test/noop-module.ts", import.meta.url)),
      "client-only": fileURLToPath(new URL("./src/test/noop-module.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
