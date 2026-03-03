/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
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
    ],
  },
};

export default nextConfig;
