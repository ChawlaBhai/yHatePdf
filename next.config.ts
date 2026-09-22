import type { NextConfig } from "next";
import path from "node:path";

// Next bundles webpack internally rather than exposing it as a top-level
// dependency. We use its replacement plugin to ignore guarded Node branches
// in browser-first libraries.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { webpack: bundledWebpack } = require("next/dist/compiled/webpack/webpack");

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  webpack(config) {
    // pdfstudio/qpdf and pptxgenjs contain guarded Node-only branches. The
    // browser paths never execute those imports, but webpack still resolves
    // their `node:` specifiers while producing the client bundle.
    config.resolve.alias = {
      ...config.resolve.alias,
      "node:fs": false,
      "node:fs/promises": false,
      "node:https": false,
      "node:module": false,
      "node:path": false,
      "node:url": false,
      "node:crypto": false,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      https: false,
      module: false,
      path: false,
      url: false,
      crypto: false,
    };
    config.plugins.push(
      new bundledWebpack.NormalModuleReplacementPlugin(
        /^node:(fs(?:\/promises)?|https|module|path|url|crypto)$/,
        path.resolve(process.cwd(), "lib/browser-node-shim.ts"),
      ),
    );
    return config;
  },
};

export default nextConfig;
