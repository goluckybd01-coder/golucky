import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

const HistoryPagination: React.FC<HistoryPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : currentPage * itemsPerPage;

  return (
    <div className="flex items-center justify-center gap-3 py-3 border-t border-gray-100">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
        style={{ background: "#f3f4f6" }}
      >
        <ChevronLeft size={16} className="text-gray-500" />
      </button>
      
      <div className="flex flex-col items-center">
        <span className="text-gray-600 text-xs font-medium">
          {currentPage} / {totalPages}
        </span>
        {totalItems && (
          <span className="text-gray-400 text-[9px]">
            {startItem}-{endItem} of {totalItems}
          </span>
        )}
      </div>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
        style={{ background: "#f97316" }}
      >
        <ChevronRight size={16} className="text-white" />
      </button>
    </div>
  );
};

export default HistoryPagination;

// Helper hook for pagination logic
export const usePagination = <T,>(items: T[], itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  // Reset to page 1 when items change significantly
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, totalPages, currentPage]);
  
  const paginatedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);
  
  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    itemsPerPage,
  };
};
