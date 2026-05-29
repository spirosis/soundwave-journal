export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  stats(): Promise<{ hits: number; misses: number; size: number }>;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCacheProvider implements CacheProvider {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry || Date.now() > entry.expiresAt) {
      if (entry) this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async stats(): Promise<{ hits: number; misses: number; size: number }> {
    return { hits: this.hits, misses: this.misses, size: this.store.size };
  }
}
