/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server build for the Droplet/Docker deploy path (.next/standalone).
  // Ignored on Vercel; App Platform uses `next start` and doesn't require it.
  output: "standalone",
  outputFileTracingRoot: import.meta.dirname,
  async redirects() {
    return [
      { source: "/results", destination: "/blueprint", permanent: true },
      { source: "/profile", destination: "/blueprint", permanent: true },
      { source: "/method", destination: "/methodology", permanent: true },
      { source: "/observe", destination: "/validate", permanent: true },
    ];
  },
};
export default nextConfig;
