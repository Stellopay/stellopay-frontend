import { Button } from "@/components/ui/button";
import { TransactionsPaginationProps } from "@/types/ui";
import { getStartIndex, getEndIndex, getTotalPages } from "@/utils/paginationUtils";

export default function TransactionsPagination({
  totalItems,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
}: TransactionsPaginationProps) {
  const startItem = getStartIndex(currentPage, itemsPerPage) + 1;
  const endItem = Math.min(getEndIndex(currentPage, itemsPerPage), totalItems);
  const totalPages = getTotalPages(totalItems, itemsPerPage);
  
  // Check if we're at the first or last page
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const handlePreviousPage = () => {
    if (!isFirstPage && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLastPage && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-6 gap-4 lg:flex-row">
      <span className="text-gray-400 text-sm order-2 lg:order-1">
        Showing {startItem} to {endItem} of {totalItems} Items
      </span>
      <div className="flex items-center justify-center gap-2 order-1 lg:order-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousPage}
          disabled={isFirstPage}
          className={`${
            isFirstPage 
              ? "text-gray-400 opacity-50 cursor-not-allowed w-8 h-8 p-0" 
              : "text-gray-400 hover:bg-white w-8 h-8 p-0"
          }`}
        >
          &lt;
        </Button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant="ghost"
            size="sm"
            onClick={() => handlePageClick(page)}
            className={`${
              page === currentPage 
                ? "bg-white text-black w-8 h-8 p-0" 
                : "text-gray-400 hover:text-black hover:bg-white w-8 h-8 p-0"
            }`}
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextPage}
          disabled={isLastPage}
          className={`${
            isLastPage 
              ? "text-gray-400 opacity-50 cursor-not-allowed w-8 h-8 p-0" 
              : "text-gray-400 hover:bg-white w-8 h-8 p-0"
          }`}
        >
          &gt;
        </Button>
      </div>
    </div>
  );
}
