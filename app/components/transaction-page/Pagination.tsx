// components/pagination.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-2 px-2">
      <div className="hidden text-sm text-muted-foreground md:block">
        Showing {(currentPage - 1) * 6 + 1} to{" "}
        {Math.min(currentPage * 6, 6 * totalPages)} of {6 * totalPages} items
      </div>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            size="sm"
            onClick={() => onPageChange(page)}
            className={`${page === currentPage && "bg-white text-black"}`}
          >
            {page}
          </Button>
        ))}

        <Button
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
