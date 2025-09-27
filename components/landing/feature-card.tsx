import Image from "next/image";
import { FC } from "react";
import { FeatureCardProps } from "@/types/landing";

export const FeatureCard: FC<FeatureCardProps> = ({
  imageSrc,
  title,
  description,
}) => {
  return (
    <div
      className="
        bg-[#8EB6FF]
        rounded-xl
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
        className="rounded-md object-cover h-[200px] w-full"
      />
      <h3 className="text-xl font-semibold text-black mt-4">{title}</h3>
      <p className="text-sm text-black mt-2 flex-grow">{description}</p>
      <div className="flex justify-end mt-4">
        <div className="bg-white py-2 px-3 rounded-full transition-colors duration-300 hover:bg-gray-200">
          <span className="text-black text-lg">&#8594;</span>
        </div>
      </div>
    </div>
  );
};
