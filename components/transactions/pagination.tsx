// components/pagination.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationProps } from "@/types/ui";

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationProps) {
  // Calculate the actual item range for display
  const itemsPerPage = 6;

  const startItem = Math.max(1, (currentPage - 1) * itemsPerPage + 1);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Check if we're at the first or last page
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const handlePreviousPage = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <section className="flex items-center justify-center gap-3 py-2 my-4 px-2">
      <div className="hidden text-sm text-muted-foreground md:block">
        Showing {totalItems === 0 ? 0 : startItem} to {endItem} of {totalItems}{" "}
        items
      </div>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          onClick={handlePreviousPage}
          disabled={isFirstPage}
          className={`border border-[#2D2D2D] ${
            isFirstPage
              ? "bg-transparent text-[#505050] opacity-60 cursor-not-allowed"
              : "bg-[#12121266] text-[#E5E5E5] hover:bg-[#2D2D2D] cursor-pointer"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            size="sm"
            onClick={() => onPageChange(page)}
            className={`border border-[#2D2D2D] cursor-pointer ${
              page === currentPage
                ? "bg-white text-black"
                : "bg-[#12121266] text-[#E5E5E5] hover:bg-[#2D2D2D]"
            }`}
          >
            {page}
          </Button>
        ))}

        <Button
          size="sm"
          onClick={handleNextPage}
          disabled={isLastPage}
          className={`border border-[#2D2D2D] ${
            isLastPage
              ? "bg-transparent text-[#505050] opacity-60 cursor-not-allowed"
              : "bg-[#12121266] text-[#E5E5E5] hover:bg-[#2D2D2D] cursor-pointer"
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
