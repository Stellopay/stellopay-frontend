import React from "react";
import { Input } from "@/components/ui/input";

const Sort = () => {
  return (
    <div className="flex items-center gap-1 bg-foreground px-1  sm:px-2 rounded-[6.25rem] w-[4rem] h-7 md:w-[5rem]">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.47157 2.19526C8.34654 2.07024 8.17697 2 8.00016 2C7.82335 2 7.65378 2.07024 7.52876 2.19526L3.52876 6.19526C3.26841 6.45561 3.26841 6.87772 3.52876 7.13807C3.78911 7.39842 4.21122 7.39842 4.47157 7.13807L8.00016 3.60948L11.5288 7.13807C11.7891 7.39842 12.2112 7.39842 12.4716 7.13807C12.7319 6.87772 12.7319 6.45561 12.4716 6.19526L8.47157 2.19526Z"
          fill="#707070"
        />
        <path
          d="M8.47157 14.4714C8.34654 14.5964 8.17697 14.6667 8.00016 14.6667C7.82335 14.6667 7.65378 14.5964 7.52876 14.4714L3.52876 10.4714C3.26841 10.2111 3.26841 9.78895 3.52876 9.52859C3.78911 9.26825 4.21122 9.26825 4.47157 9.52859L8.00016 13.0572L11.5288 9.52859C11.7891 9.26825 12.2112 9.26825 12.4716 9.52859C12.7319 9.78895 12.7319 10.2111 12.4716 10.4714L8.47157 14.4714Z"
          fill="#707070"
        />
      </svg>

      <Input
        type="text"
        placeholder="Sort"
        className="border-none w-full pl-0 py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px]"
      />
    </div>
  );
};

export default Sort;
