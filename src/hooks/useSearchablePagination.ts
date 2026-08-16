import { useCallback, useState } from 'react';
import { useDebouncedValue, useTablePagination } from "~/hooks";

export const useSearchablePagination = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const debouncedSearch = useDebouncedValue(searchTerm);

    const { page, limit, nextPage, prevPage, setPage } = useTablePagination();

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0);
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

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