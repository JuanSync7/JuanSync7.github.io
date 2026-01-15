/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Required for GitHub Pages static generation
  images: {
    unoptimized: true, // Required for static export
  },
  // Ensure trailing slashes are handled correctly for GitHub Pages
  trailingSlash: true,
};

export default nextConfig;
