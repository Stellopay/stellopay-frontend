import Image from "next/image";
import EnterpriseSolutionCard, {
  IEnterpriseSolutionCardData,
} from "../ui/enterprise-solution-card";

interface IFeature {
  text: string;
}

const features: IFeature[] = [
  {
    text: "Horizon API & anchor rails",
  },
  {
    text: "Multi-asset settlement (USDC, XLM)",
  },
  {
    text: "3-second transaction finality",
  },
  {
    text: "Dedicated enterprise support",
  },
];

const enterpriseSolutionCardData: IEnterpriseSolutionCardData[] = [
  {
    value: "2.5M+",
    label: "Transactions",
    className: "text-[#83A7FF] print:text-black",
  },
  {
    value: "150+",
    label: "Countries",
    className: "text-[#C4F49F] print:text-black",
  },
  {
    value: "99.9%",
    label: "Uptime",
    className: "text-[#393A9F] print:text-black",
  },
  {
    value: "24/7",
    label: "Support",
    className: "text-[#83A7FF] print:text-black",
  },
];

const EnterpriseSolutionSection = () => {
  return (
    <section
      className="py-16 sm:py-20 lg:py-24 px-4 bg-white dark:bg-[#0D0D0D]"
      aria-labelledby="enterprise-solution-title"
    >
      <div
        className="bg-[#FFFFFF] border-2 border-[#E4E4E7] dark:bg-[#18181B] dark:border-[#27272A] shadow-lg shadow-gray-500 dark:shadow-gray-100/50 p-10 lg:p-[65px] rounded-[48px] flex gap-10 flex-col lg:flex-row lg:gap-5 justify-between items-center 2xl:max-w-[1095px] 2xl:mx-auto print:bg-white print:shadow-none print:border-gray-300 print:text-black"
        aria-describedby="enterprise-solution-desc"
      >
      <div className="flex flex-col items-start gap-5 flex-1">
        <div>
          <h4 className="font-bold text-3xl lg:text-5xl leading-12 tracking-[0.35px] text-[#09090B] dark:text-[#FAFAFA] print:text-black">
            Enterprise-ready <br />
            <span className="bg-linear-to-r from-[#83A7FF] to-[#8B5CF6] bg-clip-text text-transparent print:bg-none print:text-[#09090B]">
              Stellar-powered payments
            </span>
          </h4>
        </div>
        <div className="w-full lg:w-[458.5px]">
          <p className="text-[#52525B] dark:text-[#A1A1AA] text-start font-normal text-xl leading-[32.5px] print:text-black">
            StelloPay settles cross-border payments on the Stellar network in
            3–5 seconds for less than $0.001 per transaction. Native multi-asset
            support (USDC, XLM, and more) with built-in fiat on/off ramps via
            Stellar anchors.
          </p>
        </div>
        <div aria-label="Enterprise features">
          {features.map((feature: IFeature, idx: number) => (
            <div key={idx} className="flex items-center gap-3 my-3">
              <div className="bg-linear-to-r from-[#83A7FF] to-[#8B5CF6] h-5 w-5 rounded-full flex items-center justify-center print:hidden">
                <span className="text-white text-sm">
                  <Image
                    src={"/landing/Vector.png"}
                    alt="check-mark-vector"
                    width={9.33}
                    height={6.67}
                  />
                </span>
              </div>
              <p className="text-[#09090B] dark:text-[#FAFAFA] font-normal text-xl print:text-black">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
        <div className="flex print:hidden">
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
    </div>
    </section>
  );
};

export default EnterpriseSolutionSection;
