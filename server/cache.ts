/** Small in-memory TTL cache that also shares one in-flight load between concurrent callers. */
export class TtlCache {
  private entries = new Map<string, { expires: number; value: unknown }>();
  private inflight = new Map<string, Promise<unknown>>();

  constructor(
    private now: () => number = Date.now,
    private maxEntries = 500,
  ) {}

  async getOrLoad<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && hit.expires > this.now()) return hit.value as T;

    const pending = this.inflight.get(key);
    if (pending) return pending as Promise<T>;

    const promise = load()
      .then((value) => {
        this.entries.delete(key);
        this.entries.set(key, { expires: this.now() + ttlMs, value });
        if (this.entries.size > this.maxEntries) {
          this.entries.delete(this.entries.keys().next().value as string);
        }
        return value;
      })
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }
}
