/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist references the optional Node `canvas` package, which must not be
  // bundled for the browser. This alias requires the Webpack bundler, so the
  // dev/build scripts pass `--webpack` to opt out of the Next.js 16 Turbopack
  // default. Migrating this alias to `turbopack.resolveAlias` is a follow-up.
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      canvas: false,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https: blob:; font-src 'self' data:; frame-src 'self' blob:; object-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
      {
        protocol: "https",
        hostname: "cdn.imagin.studio",
      },
      // CarsXE serves images from their CDN — allow all subdomains
      {
        protocol: "https",
        hostname: "**.carsxe.com",
      },
      {
        protocol: "https",
        hostname: "carsxe.com",
      },
      // CarsXE may also serve via Cloudinary or similar CDNs
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "tailark.com",
      },
    ],
  },
};

export default nextConfig;
