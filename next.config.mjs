/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
