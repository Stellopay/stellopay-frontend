import { FeatureCard } from "./feature-card";

const features = [
  {
    imageSrc: "/feature4.svg",
    title: "Secure Transactions",
    description:
      "Your payroll is protected with advanced blockchain encryption, ensuring safe and tamper-proof salary disbursements. Transaction is recorded transparently on the Stellar blockchain.",
  },
  {
    imageSrc: "/feature2.svg",
    title: "Instant Payments",
    description:
      "Say goodbye to delays—send and receive salaries in seconds, anytime, anywhere. With blockchain-powered automation, employees get paid on time seamlessly.",
  },
  {
    imageSrc: "/feature3.svg",
    title: "User Friendly Dashboard",
    description:
      "Manage payroll effortlessly with an intuitive, easy-to-navigate interface. Track payments, generate reports, and access insights—all in one place.",
  },
  {
    imageSrc: "/feature1.svg",
    title: "Real-Time Notifications",
    description:
      "Stay updated with instant alerts on salary transactions and account activities. Never miss a payment or system update, ensuring complete payroll transparency.",
  },
];

// background: linear-gradient(180deg, #512DA4 0%, #A818B6 100%);
// background: linear-gradient(180deg, #512DA4 0%, #A818B6 100%);



export const KeyFeatures = () => {
  return (
    <section
      id="KeyFeatures"
      className="relative overflow-hidden bg-[#EEF4FF]"
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Top Right Purple Glow */}
        <div
          className="absolute top-[-20%] right-[-10%] opacity-30 blur-[224px]"
          style={{
            width: '350px',
            height: '935px',
            background: 'linear-gradient(180deg, #512DA4 0%, #A818B6 100%)',
            transform: 'rotate(-123deg)',
          }}
        />
        {/* Top Left Purple Glow */}
        <div
          className="absolute top-[-20%] left-[-10%] opacity-30 blur-[224px]"
          style={{
            width: '350px',
            height: '935px',
            background: 'linear-gradient(180deg, #512DA4 0%, #A818B6 100%)',
            transform: 'rotate(130deg)',
          }}
        />
      </div>
      <div className="relative z-10 py-24 px-4 md:px-10 text-center">
        <div className="max-w-7xl mx-auto  flex flex-col justify-center h-full relative z-10">
          <div className="bg-white w-12 h-1 rounded-full mb-6 mx-auto" />
          <h2 className="text-[40px] md:text-[48px] font-bold text-black mb-6 font-clash tracking-tight">Key features</h2>
          <p className="text-[#4A4A4A] mb-16 text-base md:text-lg text-center max-w-3xl mx-auto font-general leading-relaxed">
            Stellopay simplifies payroll with blockchain efficiency, ensuring
            seamless transactions for businesses worldwide. Designed for speed and
            security.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-center items-start mx-auto">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
