import { describe, expect, it } from 'vitest';

import { isUuidV7, uuidv7 } from './uuid';

describe('uuidv7', () => {
  it('returns a version-7 UUID string', () => {
    const id = uuidv7();
    expect(isUuidV7(id)).toBe(true);
  });

  it('embeds the provided timestamp in the high bits', () => {
    const fixed = 1_700_000_000_000;
    const id = uuidv7(fixed);
    const hex = id.replace(/-/g, '');
    const ts = Number(BigInt(`0x${hex.slice(0, 12)}`));
    expect(ts).toBe(fixed);
  });

  it('produces distinct values across calls', () => {
    const a = uuidv7();
    const b = uuidv7();
    expect(a).not.toBe(b);
  });
});

describe('isUuidV7', () => {
  it('rejects non-v7 UUIDs', () => {
    expect(isUuidV7('00000000-0000-4000-8000-000000000000')).toBe(false);
    expect(isUuidV7('not-a-uuid')).toBe(false);
  });
});
