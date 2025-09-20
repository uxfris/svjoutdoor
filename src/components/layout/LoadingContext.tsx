"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  startNavigation: () => void;
  endNavigation: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const startNavigation = useCallback(() => {
    setIsLoading(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a shorter timeout for better UX (3 seconds)
    timeoutRef.current = setTimeout(() => {
      console.warn("Loading timeout reached, ending navigation loading");
      setIsLoading(false);
    }, 3000);
  }, []);

  const endNavigation = useCallback(() => {
    setIsLoading(false);

    // Clear the timeout when navigation ends
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      isLoading,
      setLoading,
      startNavigation,
      endNavigation,
    }),
    [isLoading, setLoading, startNavigation, endNavigation]
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
