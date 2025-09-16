import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VideoData } from '@/services/videoService';

interface CacheKey {
  topic: string;
  goal: string;
}

interface CacheEntry {
  videos: VideoData[];
  timestamp: number;
}

interface VideoCacheContextType {
  getCachedVideos: (topic: string, goal: string) => VideoData[] | null;
  setCachedVideos: (topic: string, goal: string, videos: VideoData[]) => void;
  clearCache: (topic: string, goal: string) => void;
  clearAllCache: () => void;
}

const VideoCacheContext = createContext<VideoCacheContextType | undefined>(undefined);

export const useVideoCache = () => {
  const context = useContext(VideoCacheContext);
  if (context === undefined) {
    throw new Error('useVideoCache must be used within a VideoCacheProvider');
  }
  return context;
};

interface VideoCacheProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'videoCache';

// Helper functions for sessionStorage
const loadCacheFromStorage = (): Map<string, CacheEntry> => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.warn('Failed to load cache from sessionStorage:', error);
  }
  return new Map();
};

const saveCacheToStorage = (cache: Map<string, CacheEntry>) => {
  try {
    const cacheObject = Object.fromEntries(cache);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObject));
  } catch (error) {
    console.warn('Failed to save cache to sessionStorage:', error);
  }
};

export const VideoCacheProvider = ({ children }: VideoCacheProviderProps) => {
  const [cache, setCache] = useState<Map<string, CacheEntry>>(() => loadCacheFromStorage());

  // Save to sessionStorage whenever cache changes
  useEffect(() => {
    saveCacheToStorage(cache);
  }, [cache]);

  const getCacheKey = (topic: string, goal: string): string => {
    return `${topic.toLowerCase().trim()}-${goal.toLowerCase().trim()}`;
  };

  const getCachedVideos = (topic: string, goal: string): VideoData[] | null => {
    const key = getCacheKey(topic, goal);
    const entry = cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Optional: Add cache expiration (e.g., 1 hour)
    const now = Date.now();
    const cacheAge = now - entry.timestamp;
    const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (cacheAge > maxAge) {
      // Cache expired, remove it
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }

    return entry.videos;
  };

  const setCachedVideos = (topic: string, goal: string, videos: VideoData[]): void => {
    const key = getCacheKey(topic, goal);
    const entry: CacheEntry = {
      videos,
      timestamp: Date.now()
    };

    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, entry);
      return newCache;
    });
  };

  const clearCache = (topic: string, goal: string): void => {
    const key = getCacheKey(topic, goal);
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
  };

  const clearAllCache = (): void => {
    setCache(new Map());
  };

  const value = {
    getCachedVideos,
    setCachedVideos,
    clearCache,
    clearAllCache,
  };

  return (
    <VideoCacheContext.Provider value={value}>
      {children}
    </VideoCacheContext.Provider>
  );
};
