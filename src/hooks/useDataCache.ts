"use client";

import { useCallback, useRef } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
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

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const globalCache = new DataCache();

export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options;
  const fetcherRef = useRef(fetcher);

  // Update fetcher ref when it changes
  fetcherRef.current = fetcher;

  const getCachedData = useCallback((): T | null => {
    return globalCache.get<T>(key);
  }, [key]);

  const setCachedData = useCallback(
    (data: T) => {
      globalCache.set(key, data, ttl);
    },
    [key, ttl]
  );

  const clearCache = useCallback(() => {
    globalCache.delete(key);
  }, [key]);

  const fetchData = useCallback(async (): Promise<T> => {
    // Check cache first
    const cached = getCachedData();
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcherRef.current();
    setCachedData(data);
    return data;
  }, [getCachedData, setCachedData]);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    fetchData,
  };
}

// Hook for invalidating cache entries
export function useCacheInvalidation() {
  const invalidate = useCallback((key?: string) => {
    if (key) {
      globalCache.delete(key);
    } else {
      globalCache.clear();
    }
  }, []);

  return { invalidate };
}
