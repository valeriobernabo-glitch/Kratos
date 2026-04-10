import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kratos/shared", "@kratos/api-client"],
};

export default nextConfig;
