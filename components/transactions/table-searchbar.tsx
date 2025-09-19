import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const TableSearchbar = ({ onSearch }: any) => {
  return (
    <div className="flex items-center bg-transparent rounded-[6.25rem]   ">
      <Search className="text-gray-600 w-5 h-5 " />

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
