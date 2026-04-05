import { useMemo, useState } from 'react';

export default function usePagination(items = [], pageSize = 5) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const currentItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const goToPage = (target) => setPage(Math.min(Math.max(target, 1), totalPages));

  return { page, totalPages, currentItems, goToPage, setPage };
}
