import { Button } from "@/components/ui/button";

interface TransactionsPaginationProps {
  totalItems: number;
  currentPage?: number;
  itemsPerPage?: number;
}

export default function TransactionsPagination({
  totalItems,
  currentPage = 1,
  itemsPerPage = 10,
}: TransactionsPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col items-center justify-center mt-6 gap-4 lg:flex-row ">
      <span className="text-gray-400 text-sm order-2 lg:order-1">
        Showing {startItem} to {endItem} of {totalItems} Items
      </span>
      <div className="flex items-center justify-center gap-2 order-1 lg:order-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400  hover:bg-white w-8 h-8 p-0"
        >
          &lt;
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="bg-white text-black w-8 h-8 p-0"
        >
          1
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-black hover:bg-white w-8 h-8 p-0"
        >
          2
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-black hover:bg-white w-8 h-8 p-0"
        >
          3
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-black hover:bg-white w-8 h-8 p-0"
        >
          &gt;
        </Button>
      </div>
    </div>
  );
}
