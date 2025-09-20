import { NextRequest } from "next/server";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Global API cache instance
const apiCache = new APICache();

export function getCachedData<T>(key: string): T | null {
  return apiCache.get<T>(key);
}

export function setCachedData<T>(key: string, data: T, ttl?: number): void {
  apiCache.set(key, data, ttl);
}

export function clearCache(key?: string): void {
  if (key) {
    apiCache.delete(key);
  } else {
    apiCache.clear();
  }
}

// Helper function to generate cache key from request
export function generateCacheKey(request: NextRequest, prefix: string): string {
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  return `${prefix}:${url.pathname}:${searchParams}`;
}

// Helper function to check if request should be cached
export function shouldCache(request: NextRequest): boolean {
  // Don't cache POST, PUT, DELETE requests
  if (request.method !== "GET") return false;

  // Don't cache requests with certain headers
  const cacheControl = request.headers.get("cache-control");
  if (cacheControl?.includes("no-cache")) return false;

  return true;
}
