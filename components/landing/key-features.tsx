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

export const KeyFeatures = () => {
  return (
    <section
      id="KeyFeatures"
      className="py-16 px-4 md:px-10 text-center min-h-screen bg-[#EEF4FF]"
    >
      <div className="max-w-6xl mx-auto flex flex-col justify-center h-full">
        <div className="bg-white w-12 h-1 rounded-full mb-4 mx-auto" />
        <h2 className="text-4xl font-bold text-black mb-4 font-clash">Key features</h2>
        <p className="text-gray-700 mb-12 text-base text-center max-w-4xl mx-auto">
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
    </section>
  );
};
