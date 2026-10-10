import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Playwright's E2E config drives the browser against 127.0.0.1 rather than
  // localhost; without this, Next's dev-origin check blocks the HMR websocket,
  // which triggers a full page reload mid-test and breaks form submission.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
