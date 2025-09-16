// src/context/VideoCacheContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import { VideoData } from "@/services/videoService";

type VideoCache = Record<string, VideoData[]>;

interface VideoCacheContextType {
  cache: VideoCache;
  setCache: (key: string, videos: VideoData[]) => void;
  clearCache: (key?: string) => void;
}

const VideoCacheContext = createContext<VideoCacheContextType>({
  cache: {},
  setCache: () => {},
  clearCache: () => {},
});

export const VideoCacheProvider = ({ children }: { children: ReactNode }) => {
  const [cache, setCacheState] = useState<VideoCache>({});

  const setCache = (key: string, videos: VideoData[]) => {
    setCacheState((prev) => ({ ...prev, [key]: videos }));
  };

  const clearCache = (key?: string) => {
    if (!key) {
      setCacheState({});
    } else {
      setCacheState((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <VideoCacheContext.Provider value={{ cache, setCache, clearCache }}>
      {children}
    </VideoCacheContext.Provider>
  );
};

export const useVideoCache = () => useContext(VideoCacheContext);
