import Image from "next/image";
import { FC } from "react";
import { FeatureCardProps } from "@/types/landing";
import { IoMdArrowForward } from "react-icons/io";

export const FeatureCard: FC<FeatureCardProps> = ({
  imageSrc,
  title,
  description,
}) => {
  return (
    <div
      className="
        bg-[#8EB6FF]
        rounded-md
        shadow-md
        p-4
        w-full
        h-[460px]
        max-w-sm
        flex flex-col
        justify-between
        transform
        transition-transform
        duration-300
        ease-in-out
        hover:scale-105
        hover:shadow-xl
      "
    >
      <Image
        src={imageSrc}
        alt={title}
        width={400}
        height={200}
        className="rounded-sm object-cover h-[200px] w-full"
      />
      <h3 className="text-xl font-semibold text-black mt-4">{title}</h3>
      <p className="text-sm text-black mt-2 flex-grow">{description}</p>
      <div className="flex justify-end">
        <div className="bg-[#D9E5FF] py-2.5 px-2.5 rounded-full transition-colors duration-300 hover:bg-gray-200">
          <IoMdArrowForward className="text-[#598EFF] text-lg" />
        </div>
      </div>
    </div>
  );
};
