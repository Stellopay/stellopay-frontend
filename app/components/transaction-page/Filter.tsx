import React from "react";

import { Input } from "@/components/ui/input";

const Filter = () => {
  return (
    <div className="flex items-center gap-1 bg-foreground px-1   sm:px-2 rounded-[6.25rem] w-[4rem] h-7 md:w-[5rem]">
      <svg
        width="12"
        height="10"
        viewBox="0 0 12 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.666504 0.999995C0.666504 0.631805 0.964981 0.333328 1.33317 0.333328H10.6665C11.0347 0.333328 11.3332 0.631805 11.3332 0.999995C11.3332 1.36818 11.0347 1.66666 10.6665 1.66666H1.33317C0.964981 1.66666 0.666504 1.36818 0.666504 0.999995Z"
          fill="#707070"
        />
        <path
          d="M1.99984 5C1.99984 4.63181 2.29831 4.33333 2.6665 4.33333H9.33317C9.70136 4.33333 9.99984 4.63181 9.99984 5C9.99984 5.36819 9.70136 5.66666 9.33317 5.66666H2.6665C2.29831 5.66666 1.99984 5.36819 1.99984 5Z"
          fill="#707070"
        />
        <path
          d="M3.99984 8.33333C3.63165 8.33333 3.33317 8.63181 3.33317 9C3.33317 9.36819 3.63165 9.66666 3.99984 9.66666H7.99984C8.36803 9.66666 8.6665 9.36819 8.6665 9C8.6665 8.63181 8.36803 8.33333 7.99984 8.33333H3.99984Z"
          fill="#707070"
        />
      </svg>

      <Input
        type="text"
        placeholder="Filter"
        className="border-none w-full pl-0 py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px]"
      />
    </div>
  );
};

export default Filter;
