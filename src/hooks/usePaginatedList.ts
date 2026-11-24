import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../services/api';
import type { FilterPageable, ResponsePagedCommom } from '../types/estacionamento';

interface UsePaginatedListOptions<T> {
  fetcher: (filter: FilterPageable) => Promise<ResponsePagedCommom<T>>;
  initialFilter: FilterPageable;
  enabled: boolean;
  refreshToken: number;
  errorMessage: string;
  // Identifica filtros extras do fetcher; quando muda, a listagem é buscada novamente
  queryKey?: string;
}

/**
 * Controla uma listagem paginada, buscando apenas quando ela está ativa
 * e quando o filtro, os filtros extras ou o refreshToken mudam.
 */
export function usePaginatedList<T>({
  fetcher,
  initialFilter,
  enabled,
  refreshToken,
  errorMessage,
  queryKey = '',
}: UsePaginatedListOptions<T>) {
  const [filter, setFilter] = useState<FilterPageable>(initialFilter);
  const [page, setPage] = useState<ResponsePagedCommom<T>>({
    data: [],
    totalRecords: 0,
    totalPages: 0,
    pageSize: initialFilter.size,
  });
  const [error, setError] = useState('');
  const [settledKey, setSettledKey] = useState<string | null>(null);

  const requestKey = [
    refreshToken,
    queryKey,
    filter.page,
    filter.size,
    filter.direction,
    filter.orderBy,
  ].join(':');

  useEffect(() => {
    if (!enabled || settledKey === requestKey) return;

    let cancelled = false;

    fetcher(filter)
      .then((response) => {
        if (cancelled) return;

        // Ex.: o último registro da última página foi excluído
        const lastPage = Math.max(response.totalPages - 1, 0);
        if (filter.page > lastPage) {
          setFilter((prev) => ({ ...prev, page: lastPage }));
          return;
        }

        setPage(response);
        setError('');
        setSettledKey(requestKey);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err, errorMessage));
        setSettledKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, errorMessage, fetcher, filter, requestKey, settledKey]);

  return {
    page,
    filter,
    setFilter,
    error,
    loading: enabled && settledKey !== requestKey,
  };
}
