/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Add base path for GitHub Pages deployment
  // Replace 'JuanSync7.github.io' with your repository name if it differs
  basePath: "/JuanSync7.github.io",
  assetPrefix: "/JuanSync7.github.io",
};

export default nextConfig;
