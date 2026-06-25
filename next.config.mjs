/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingExcludes: {
      "/*": [
        "./.git/**/*",
        "./.next/cache/**/*",
        "./.pnpm-store/**/*",
        "./node_modules/.cache/**/*",
        "./prisma/*.db",
        "./prisma/*.db-journal",
        "./public/images/**/*",
        "./public/uploads/**/*"
      ]
    }
  }
};

export default nextConfig;
