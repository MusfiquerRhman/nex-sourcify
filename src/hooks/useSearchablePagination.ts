import { useCallback, useEffect, useState } from 'react';
import { usePathname } from "next/navigation";
import { useDebouncedValue, useTablePagination } from "~/hooks";
import { getStoredSearchQuery, removeStoredSearchQuery, setStoredSearchQuery } from "~/utils/searchQueryStorage";

export const useSearchablePagination = () => {
    const pathname = usePathname();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setSearchTerm(getStoredSearchQuery(pathname));
    }, [pathname]);

    const debouncedSearch = useDebouncedValue(searchTerm);

    const { page, limit, nextPage, prevPage, setPage } = useTablePagination();

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0);
        const nextSearchTerm = event.target.value.trim();
        setSearchTerm(nextSearchTerm);

        if (nextSearchTerm) {
            setStoredSearchQuery(pathname, nextSearchTerm);
        } else {
            removeStoredSearchQuery(pathname);
        }
    }, [pathname, setPage]);

    return {
        searchTerm,
        debouncedSearch,
        page,
        limit,
        nextPage,
        prevPage,
        setPage,
        handleSearchChange,
    };
};