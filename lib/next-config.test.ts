import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('next.config basePath and assetPrefix', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to empty string for root deployment', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '');
    vi.stubEnv('NEXT_PUBLIC_ASSET_PREFIX', '');
    vi.stubEnv('NODE_ENV', '');

    const { nextConfig } = await import('../next.config.mjs');
    expect(nextConfig.basePath).toBe('');
    expect(nextConfig.assetPrefix).toBe('');
  });

  it('uses NEXT_PUBLIC_BASE_PATH when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/custom-path');
    vi.stubEnv('NEXT_PUBLIC_ASSET_PREFIX', '/custom-path');
    vi.stubEnv('NODE_ENV', '');

    const { nextConfig } = await import('../next.config.mjs');
    expect(nextConfig.basePath).toBe('/custom-path');
    expect(nextConfig.assetPrefix).toBe('/custom-path');
  });

  it('uses NEXT_PUBLIC_ASSET_PREFIX when set independently', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/base');
    vi.stubEnv('NEXT_PUBLIC_ASSET_PREFIX', '/assets');
    vi.stubEnv('NODE_ENV', '');

    const { nextConfig } = await import('../next.config.mjs');
    expect(nextConfig.basePath).toBe('/base');
    expect(nextConfig.assetPrefix).toBe('/assets');
  });

  it('does not default to /socialkit in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '');
    vi.stubEnv('NEXT_PUBLIC_ASSET_PREFIX', '');

    const { nextConfig } = await import('../next.config.mjs');
    expect(nextConfig.basePath).not.toBe('/socialkit');
    expect(nextConfig.assetPrefix).not.toBe('/socialkit');
    expect(nextConfig.basePath).toBe('');
    expect(nextConfig.assetPrefix).toBe('');
  });

  it('allows GitHub Pages deployment via env vars', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/socialkit');
    vi.stubEnv('NEXT_PUBLIC_ASSET_PREFIX', '/socialkit');

    const { nextConfig } = await import('../next.config.mjs');
    expect(nextConfig.basePath).toBe('/socialkit');
    expect(nextConfig.assetPrefix).toBe('/socialkit');
  });
});
