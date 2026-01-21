import { FeesIcon, BankingIcon, SupportIcon } from "@/public/svg/svg";

const benefits = [
  {
    title: "Low Fees",
    description:
      "Reduce payroll costs with blockchain-powered transactions that eliminate excessive banking fees and hidden charges. Stellopay ensures more of your money goes where it matters.",
    icon: <FeesIcon color="black" />,
    featured: true,
  },
  {
    title: "Ease of Use",
    description:
      "Our intuitive platform simplifies payroll management with seamless automation, real-time tracking, and effortless navigation—no technical expertise required.",
    icon: <BankingIcon color="black" />,
    featured: false,
  },
  {
    title: "Reliable Customer Support",
    description:
      "Get dedicated assistance whenever you need it. Our expert support team is always available to help with transactions, troubleshooting, and guidance.",
    icon: <SupportIcon color="black" />,
    featured: false,
  },
];

export default function BenefitsSection() {
  return (
    <section className="relative bg-[#040404] pt-24 pb-10 px-4 text-white min-h-screen">
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `
          radial-gradient(circle at 20% 70%, rgba(27, 67, 245, 0.15) 15%, transparent 30%),
          radial-gradient(circle at 50% 30%, rgba(27, 67, 245, 0.15) 35%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(27, 67, 245, 0.15) 15%, transparent 30%)`,
          filter: "blur(200px)",
        }}
      />
      <div className="relative z-20 w-10 h-1 bg-white mx-auto" />
      <div id="Benefits" className="relative z-20 text-center max-w-4xl mx-auto">
        <h2 className="text-[45px] font-clash py-1">Benefits</h2>
        <p className="text-base leading-[22px] text-[#C7C7C7] font-general max-w-170 mx-auto">
          All in one seamless platform. Stellopay ensures secure, instant salary
          payments without the complexity.
        </p>
      </div>

      <div className="relative z-20 max-w-6xl mx-auto mt-10">
        {/* Featured card - Low Fees */}
        <div className="flex justify-center mb-8 max-w-[400px] mx-auto">
          <div className="w-full max-w-md bg-[#8EB6FF] rounded-[8px] p-6 text-center">
            <div className="w-15 h-15 mx-auto mb-6 flex items-center justify-center rounded-full bg-white">
              {benefits[0].icon}
            </div>
            <h3 className="text-2xl  font-clash mb-3 text-[#060606]">
              {benefits[0].title}
            </h3>
            <p className=" text-sm text-[#212121] font-general font-medium leading-[19px]">
              {benefits[0].description}
            </p>
          </div>
        </div>

        {/* Bottom two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[832px] mx-auto">
          {benefits.slice(1).map((benefit, index) => (
            <div
              key={index}
              className="bg-transparent border border-[#598EFF] max-w-[400px] mx-auto rounded-[8px] p-6 text-center"
            >
              <div className="w-15 h-15 mx-auto mb-6 flex items-center justify-center rounded-full bg-white">
                {benefit.icon}
              </div>
              <h3 className="text-2xl  font-clash mb-3 text-white">
                {benefit.title}
              </h3>
              <p className="text-sm text-[#A3A3A3]  font-general font-medium leading-[19px]">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
