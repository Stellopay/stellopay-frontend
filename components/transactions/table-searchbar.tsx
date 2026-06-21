import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TableSearchbarProps {
  onSearch: (value: string) => void;
  debounceMs?: number;
  defaultValue?: string;
}

/** Debounces client-side transaction filtering while keeping the field controlled locally. */
const TableSearchbar = ({
  onSearch,
  debounceMs = 250,
  defaultValue = "",
}: TableSearchbarProps) => {
  const [searchValue, setSearchValue] = React.useState(defaultValue);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onSearch(searchValue);
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, onSearch, searchValue]);

  return (
    <div className="flex items-center bg-transparent rounded-[6.25rem]   ">
      <Search className="w-5 h-5 text-gray-600 " />

      <Input
        type="search"
        aria-label="Search transactions"
        placeholder="Search"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="border-none py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px]"
      />
    </div>
  );
};

export default TableSearchbar;
