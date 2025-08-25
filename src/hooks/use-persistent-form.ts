import { useState, useEffect, useCallback } from 'react';

interface UsePersistentFormOptions<T> {
  key: string;
  initialData: T;
  debounceMs?: number;
}

export function usePersistentForm<T>({ 
  key, 
  initialData, 
  debounceMs = 500 
}: UsePersistentFormOptions<T>) {
  const [data, setData] = useState<T>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsedData = JSON.parse(saved);
        setData({ ...initialData, ...parsedData });
      }
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  // Debounced save to localStorage
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save form data to localStorage:', error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [data, key, debounceMs, isLoaded]);

  const updateData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    if (typeof updates === 'function') {
      setData(updates);
    } else {
      setData(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setData(initialData);
    } catch (error) {
      console.warn('Failed to clear form data from localStorage:', error);
    }
  }, [key, initialData]);

  return {
    data,
    updateData,
    clearData,
    isLoaded
  };
}