import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type TableSearchbarProps = {
  onSearch: (value: string) => void
}

const TableSearchbar = ({onSearch}: TableSearchbarProps) => {
  return (
    <div className="flex items-center bg-transparent rounded-[6.25rem]   ">
      <Search className="w-5 h-5 text-gray-600 " />

      <Input
        type="text"
        placeholder="Search"
        onChange={(e) => onSearch(e.target.value)}
        className="border-none py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px]"
      />
    </div>
  );
};

export default TableSearchbar;
