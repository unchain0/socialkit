import nextra from 'nextra';

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  // Only apply basePath/assetPrefix for production builds (GitHub Pages).
  // Local dev (yarn dev) runs without these env vars and should serve at root.
  basePath: process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_BASE_PATH ?? '/socialkit'
    : '',
  assetPrefix: process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_ASSET_PREFIX ?? '/socialkit'
    : '',
};

export default withNextra(nextConfig);