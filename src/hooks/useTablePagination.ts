import { useState, useCallback } from "react";

export const useTablePagination = () => {
  const [page, setPage] = useState(0);
  const limit = 15;

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 0));
  }, []);

  return { page, limit, nextPage, prevPage, setPage };
};