import nextra from 'nextra';

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
});

/** @type {import('next').NextConfig} */
export const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  // Apply basePath/assetPrefix only when explicitly configured via env vars.
  // Default to root deployment (e.g., custom domain https://www.socialkit.dev).
  // For GitHub Pages project site, set NEXT_PUBLIC_BASE_PATH=/socialkit and
  // NEXT_PUBLIC_ASSET_PREFIX=/socialkit at build time.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX ?? '',
};

export default withNextra(nextConfig);

