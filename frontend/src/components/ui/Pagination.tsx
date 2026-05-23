// ============================================================
// Pagination — CDS SME Design System
// ============================================================
import React from 'react';

export interface PaginationProps {
  /** Trang hiện tại (1-based) */
  page: number;
  /** Tổng số bản ghi */
  total: number;
  /** Số bản ghi mỗi trang */
  pageSize: number;
  /** Callback khi đổi trang */
  onPageChange: (page: number) => void;
  /** Callback khi đổi số dòng/trang */
  onPageSizeChange?: (size: number) => void;
  /** Tuỳ chọn số dòng/trang */
  pageSizeOptions?: number[];
}

const PAGE_SIZE_DEFAULTS = [10, 20, 50];

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_DEFAULTS,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Build page number list with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (page > 3) pages.push('ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className="pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap',
      }}
    >
      {/* Thông tin bản ghi */}
      <div style={{ fontSize: 13, color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
        {total === 0 ? (
          'Không có bản ghi nào'
        ) : (
          <>
            Hiển thị{' '}
            <strong style={{ color: 'var(--text)' }}>
              {from}–{to}
            </strong>{' '}
            / <strong style={{ color: 'var(--text)' }}>{total}</strong> bản ghi
          </>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Chọn số dòng/trang */}
        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>Hiển thị</span>
            <select
              className="select"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              style={{ padding: '4px 8px', fontSize: 13, height: 32, width: 'auto', minWidth: 64 }}
              aria-label="Số dòng mỗi trang"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>dòng</span>
          </div>
        )}

        {/* Page number buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Trước */}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Trang trước"
            style={{ padding: '4px 10px', fontSize: 13 }}
          >
            ‹ Trước
          </button>

          {/* Page numbers */}
          {pageNumbers.map((p, idx) =>
            p === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                style={{ padding: '4px 6px', fontSize: 13, color: 'var(--text-subtle)' }}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`btn btn--sm${p === page ? ' btn--primary' : ' btn--ghost'}`}
                onClick={() => onPageChange(p)}
                aria-label={`Trang ${p}`}
                aria-current={p === page ? 'page' : undefined}
                style={{ padding: '4px 10px', fontSize: 13, minWidth: 36 }}
              >
                {p}
              </button>
            )
          )}

          {/* Sau */}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Trang sau"
            style={{ padding: '4px 10px', fontSize: 13 }}
          >
            Sau ›
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook tiện lợi để quản lý pagination state
export function usePagination<T>(
  data: T[],
  initialPageSize = 10,
): {
  page: number;
  pageSize: number;
  total: number;
  paged: T[];
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  resetPage: () => void;
} {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const total = data.length;
  const paged = data.slice((page - 1) * pageSize, page * pageSize);

  const handleSetPageSize = (s: number) => {
    setPageSize(s);
    setPage(1);
  };

  const resetPage = React.useCallback(() => setPage(1), []);

  return { page, pageSize, total, paged, setPage, setPageSize: handleSetPageSize, resetPage };
}
