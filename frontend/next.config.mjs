/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* to the backend at port 8000 (avoids CORS in dev)
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
