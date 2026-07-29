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
    <div className="border-2 border-border p-[25px] rounded-2xl w-full h-[118px] flex flex-col gap-2">
      <p
        className={`font-bold text-4xl leading-10 tracking-[0.37px] text-center ${className}`}
      >
        {value}
      </p>

      <p className="font-normal leading-5 tracking-[-0.15px] text-center text-muted-foreground">
        {label}
      </p>
    </div>
  );
};

export default EnterpriseSolutionCard;
