import { resolve } from "node:path"
import { config } from "dotenv"

/**
 * Local development reads the single .env at the repo root, with an optional
 * apps/api/.env layered on top for machine-specific overrides. In production
 * the host (Railway) injects real environment variables and neither file
 * exists, so nothing is read.
 *
 * Paths resolve from the working directory, which pnpm sets to this package.
 *
 * This module is deliberately synchronous. An earlier version used
 * `await import("dotenv")`, which made it an async module — and under the ES
 * module spec a sibling import such as `./env` still evaluates before an async
 * module's body finishes, so validation ran against an empty process.env.
 * Bundling hid the bug by collapsing everything into one module scope.
 */
if (process.env.NODE_ENV !== "production") {
  config({ path: resolve(process.cwd(), "../../.env") })
  config({ path: resolve(process.cwd(), ".env"), override: true })
}
