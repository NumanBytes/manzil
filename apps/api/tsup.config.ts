import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  sourcemap: true,
  clean: true,
  // Workspace packages ship raw TypeScript, so they must be bundled rather than
  // left as runtime imports Node cannot resolve.
  noExternal: ["@manzil/db", "@manzil/shared"],
  // tsup only externalises this package's own `dependencies`. These three come
  // in through @manzil/db and are CommonJS, which breaks when inlined into an
  // ESM bundle, so they are listed here and declared as runtime dependencies of
  // this service. dotenv is dev-only and imported dynamically in load-env.ts.
  external: [
    "dotenv",
    "@prisma/client",
    "@prisma/client/*",
    "@prisma/adapter-pg",
    "pg",
  ],
})
