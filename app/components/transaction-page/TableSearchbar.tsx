import React from "react";
import { Input } from "@/components/ui/input";

import { Search } from "lucide-react";

const TableSearchbar = () => {
  return (
    <div className="flex items-center gap-1 bg-foreground px-1 border border-[#2D2D2D]  sm:px-2 rounded-[6.25rem] w-[6rem] h-7 md:w-[7rem]">
      <Search className="text-gray-600 w-5 h-5 " />

      <Input
        type="text"
        placeholder="Search"
        className="border-none w-full pl-0 py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px]"
      />
    </div>
  );
};

export default TableSearchbar;
