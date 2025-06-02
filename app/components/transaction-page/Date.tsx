import React from "react";

const Date = ({ date }: { date: string }) => {
  return (
    <button className="flex gap-1 items-center cursor-pointer">
      <svg
        width="16"
        height="17"
        viewBox="0 0 16 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 1.83334V3.16667M4 1.83334V3.16667"
          stroke="#CBD2EB"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M7.99716 9.16666H8.00316M7.99716 11.8333H8.00316M10.6608 9.16666H10.6668M5.3335 9.16666H5.33948M5.3335 11.8333H5.33948"
          stroke="#CBD2EB"
          stroke-width="1.33333"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M2.3335 5.83334H13.6668"
          stroke="#CBD2EB"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M1.6665 8.66213C1.6665 5.75729 1.6665 4.30485 2.50125 3.40243C3.336 2.5 4.6795 2.5 7.3665 2.5H8.63317C11.3202 2.5 12.6637 2.5 13.4984 3.40243C14.3332 4.30485 14.3332 5.75729 14.3332 8.66213V9.00453C14.3332 11.9094 14.3332 13.3618 13.4984 14.2643C12.6637 15.1667 11.3202 15.1667 8.63317 15.1667H7.3665C4.6795 15.1667 3.336 15.1667 2.50125 14.2643C1.6665 13.3618 1.6665 11.9094 1.6665 9.00453V8.66213Z"
          stroke="#CBD2EB"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M2 5.83334H14"
          stroke="#CBD2EB"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <span className="text-sm">{date}</span>
    </button>
  );
};

export default Date;
