import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const TableSearchbar = ({ onSearch }: any) => {
  return (
    <div className="flex items-center rounded-[6.25rem] px-3 py-1 border border-[#2E2E2E] bg-[#121212] h-9 w-full">
      <Search className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0" />

      <Input
        type="text"
        placeholder="Search"
        onChange={(e) => onSearch(e.target.value)}
        className="border-none py-0 focus-visible:ring-0 text-[13px] p-0 sm:text-[14px] bg-transparent placeholder:text-gray-400 text-white h-auto flex-1 min-w-0"
      />
    </div>
  );
};

export default TableSearchbar;
