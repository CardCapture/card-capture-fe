import { useState, useRef, useCallback } from "react";

export function useDebouncedSearch(delay: number = 300) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearchQuery(query);
      }, delay);
    },
    [delay]
  );

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    setDebouncedSearchQuery,
    debouncedSearch,
    debounceTimerRef,
  };
}
