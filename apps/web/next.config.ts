import { resolve } from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// Next only looks for .env files inside this package, but the monorepo keeps a
// single .env at the repo root. Load it before the config is evaluated so both
// server and NEXT_PUBLIC_ values are available to dev and build.
config({ path: resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {
  // Workspace packages ship raw TypeScript rather than a build output, so Next
  // has to compile them alongside the app.
  transpilePackages: ["@manzil/shared"],
};

export default nextConfig;
