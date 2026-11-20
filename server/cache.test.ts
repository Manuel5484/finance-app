// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from './cache';

describe('TtlCache', () => {
  it('serves a fresh entry without calling the loader again', async () => {
    const cache = new TtlCache(() => 0);
    const load = vi.fn(async () => 'value');
    expect(await cache.getOrLoad('k', 1000, load)).toBe('value');
    expect(await cache.getOrLoad('k', 1000, load)).toBe('value');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reloads after the TTL expires', async () => {
    let now = 0;
    const cache = new TtlCache(() => now);
    const load = vi.fn(async () => now);
    await cache.getOrLoad('k', 1000, load);
    now = 1001;
    expect(await cache.getOrLoad('k', 1000, load)).toBe(1001);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight load between concurrent callers', async () => {
    const cache = new TtlCache();
    const load = vi.fn(() => new Promise<string>((resolve) => setTimeout(() => resolve('x'), 10)));
    const results = await Promise.all([cache.getOrLoad('k', 1000, load), cache.getOrLoad('k', 1000, load)]);
    expect(results).toEqual(['x', 'x']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures', async () => {
    const cache = new TtlCache();
    const load = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok');
    await expect(cache.getOrLoad('k', 1000, load)).rejects.toThrow('boom');
    expect(await cache.getOrLoad('k', 1000, load)).toBe('ok');
  });

  it('keeps keys independent', async () => {
    const cache = new TtlCache();
    expect(await cache.getOrLoad('a', 1000, async () => 1)).toBe(1);
    expect(await cache.getOrLoad('b', 1000, async () => 2)).toBe(2);
  });

  it('evicts the oldest entry when it exceeds maxEntries', async () => {
    const cache = new TtlCache(() => 0, 2);
    const load = vi.fn(async () => 'v');
    await cache.getOrLoad('a', 1000, load);
    await cache.getOrLoad('b', 1000, load);
    await cache.getOrLoad('c', 1000, load);
    load.mockClear();
    await cache.getOrLoad('b', 1000, load);
    await cache.getOrLoad('c', 1000, load);
    expect(load).not.toHaveBeenCalled();
    await cache.getOrLoad('a', 1000, load);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
