import { useState, useMemo, useCallback } from 'react';

export function useSearch<T>(
    items: T[],
    searchFn: (item: T, terms: string[]) => boolean
) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) {
            return items;
        }

        const searchLower = searchQuery.toLowerCase();
        const searchTerms = searchLower.split(/\s+/).filter(Boolean);

        return items.filter(item => searchFn(item, searchTerms));
    }, [items, searchQuery, searchFn]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    return {
        searchQuery,
        setSearchQuery: handleSearch,
        filteredItems,
        handleClearSearch,
    };
}
