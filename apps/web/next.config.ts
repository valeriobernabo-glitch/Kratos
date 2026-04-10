import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@kratos/shared", "@kratos/api-client"],
};

export default nextConfig;
