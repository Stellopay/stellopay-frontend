// components/pagination.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationProps } from "@/types/ui";

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems
}: PaginationProps) {
  console.log(currentPage, totalPages)
  return (
    <section className="flex items-center justify-center gap-3 py-2 my-4  px-2 ">
      <div className="hidden text-sm text-muted-foreground md:block">
        Showing {(currentPage - 1) * 6 + 1} to{" "}
        0{Math.min(currentPage * 6, totalItems)} of {totalItems} items
      </div>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
       
          className="bg-transparent text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            size="sm"
            onClick={() => onPageChange(page)}
            className={`${page === currentPage ? "bg-[#eee] text-black" :"bg-transparent text-muted-foreground"} `}
          >
            {page}
          </Button>
        ))}

        <Button
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          className="bg-transparent text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
