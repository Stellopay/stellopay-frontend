import Image from "next/image";
import EnterpriseSolutionCard, {
  IEnterpriseSolutionCardData,
} from "../ui/enterprise-solution-card";

interface IFeature {
  text: string;
}

const features: IFeature[] = [
  {
    text: "Advanced API integration",
  },
  {
    text: "Custom payment workflows",
  },
  {
    text: "Dedicated account manager",
  },
  {
    text: "Priority support",
  },
];

const enterpriseSolutionCardData: IEnterpriseSolutionCardData[] = [
  {
    value: "2.5M+",
    label: "Transactions",
    className: "text-[#83A7FF]",
  },
  {
    value: "150+",
    label: "Countries",
    className: "text-[#C4F49F]",
  },
  {
    value: "99.9%",
    label: "Uptime",
    className: "text-[#393A9F]",
  },
  {
    value: "24/7",
    label: "Support",
    className: "text-[#83A7FF]",
  },
];

const EnterpriseSolutionSection = () => {
  return (
    <section
      className="bg-[#FFFFFF] border-2 border-[#E4E4E7] dark:bg-[#18181B] dark:border-[#27272A] shadow-lg shadow-gray-500 dark:shadow-gray-100/50 p-10 lg:p-[65px] rounded-[48px] flex gap-10 flex-col lg:flex-row lg:gap-5 justify-between items-center m-4 2xl:max-w-[1095px] 2xl:mx-auto"
      aria-labelledby="enterprise-solution-title"
      aria-describedby="enterprise-solution-desc"
    >
      <div className="flex flex-col items-start gap-5 flex-1">
        <div>
          <h4 className="font-bold text-3xl lg:text-5xl leading-12 tracking-[0.35px] text-[#09090B] dark:text-[#FAFAFA]">
            Enterprise-ready <br />
            <span className="bg-linear-to-r from-[#83A7FF] to-[#8B5CF6] bg-clip-text text-transparent">
              blockchain solution
            </span>
          </h4>
        </div>
        <div className="w-full lg:w-[458.5px]">
          <p className="text-[#52525B] dark:text-[#A1A1AA] text-start font-normal text-xl leading-[32.5px]">
            StelloPay is built for scale. Whether you&apos;re a startup or an
            enterprise, our platform grows with your business needs.
          </p>
        </div>
        <div aria-label="Enterprise features">
          {features.map((feature: IFeature, idx: number) => (
            <div key={idx} className="flex items-center gap-3 my-3">
              <div className="bg-linear-to-r from-[#83A7FF] to-[#8B5CF6] h-5 w-5 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">
                  <Image
                    src={"/landing/Vector.png"}
                    alt="check-mark-vector"
                    width={9.33}
                    height={6.67}
                  />
                </span>
              </div>
              <p className="text-[#09090B] dark:text-[#FAFAFA] font-normal text-xl">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
        <div className="flex">
          <a
            className="inline-flex items-center justify-center bg-linear-to-r from-[#83A7FF] to-[#8B5CF6] w-[165px] h-14 rounded-2xl text-center"
            href="#"
            aria-label="Contact sales about the enterprise-ready blockchain solution"
          >
            Contact Sales
          </a>
        </div>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 w-full gap-3 flex-1"
        role="region"
        aria-label="Enterprise statistics"
      >
        {enterpriseSolutionCardData.map(
          ({ value, label, className }, index) => (
            <EnterpriseSolutionCard
              value={value}
              label={label}
              className={className}
              key={index}
            />
          ),
        )}
      </div>
    </section>
  );
};

export default EnterpriseSolutionSection;
