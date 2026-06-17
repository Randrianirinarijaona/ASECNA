
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from './Spinner';
import './Table.css';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  // Pagination
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function Table<T>({
  columns,
  data,
  isLoading,
  error,
  emptyMessage = 'No data found',
  total,
  page = 1,
  pageSize = 10,
  onPageChange,
}: TableProps<T>) {
  const totalPages = total ? Math.ceil(total / pageSize) : 0;

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="table-state">
                  <Spinner size="md" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="table-state table-state--error">
                  {error}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-state table-state--empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="table-pagination">
          <span className="pagination-info">
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="pagination-controls">
            <button
              className="btn btn-icon"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={`btn btn-page ${p === page ? 'btn-page--active' : ''}`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="btn btn-icon"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}