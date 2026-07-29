export interface IEnterpriseSolutionCardData {
  value: string;
  className: string;
  label: string;
}

const EnterpriseSolutionCard = ({
  value,
  className,
  label,
}: IEnterpriseSolutionCardData) => {
  return (
    <div className="border-2 border-[#E4E4E7] dark:border-[#27272A] p-[25px] rounded-2xl w-full h-[118px] flex flex-col gap-2 print:border-gray-300 print:bg-white">
      <p
        className={`font-bold text-4xl leading-10 tracking-[0.37px] text-center ${className}`}
      >
        {value}
      </p>

      <p className="font-normal leading-5 tracking-[-0.15px] text-center text-[#52525B] dark:text-[#A1A1AA] print:text-black">
        {label}
      </p>
    </div>
  );
};

export default EnterpriseSolutionCard;
