import { FaMoneyBillWave, FaUserCog, FaHeadset } from "react-icons/fa"

const benefits = [
  {
    title: "Low Fees",
    description:
      "Reduce payroll costs with blockchain-powered transactions that eliminate excessive banking fees and hidden charges. Stellopay ensures more of your money goes where it matters.",
    icon: <FaMoneyBillWave size={24} className="text-gray-700" />,
    featured: true,
  },
  {
    title: "Ease of Use",
    description:
      "Our intuitive platform simplifies payroll management with seamless automation, real-time tracking, and effortless navigation—no technical expertise required.",
    icon: <FaUserCog size={24} className="text-gray-700" />,
    featured: false,
  },
  {
    title: "Reliable Customer Support",
    description:
      "Get dedicated assistance whenever you need it. Our expert support team is always available to help with transactions, troubleshooting, and guidance.",
    icon: <FaHeadset size={24} className="text-gray-700" />,
    featured: false,
  },
]

export default function BenefitsSection() {
  return (
    <section className="bg-[#0B0C2A] py-16 px-4 text-white min-h-screen">
        <p className="text-lg font-bold block justify-center text-center text-[#A0A0A0] mb-3">—</p>
      <div className="text-center max-w-4xl mx-auto mb-16">
        <h2 className="text-5xl font-bold mb-6">Benefits</h2>
        <p className="text-lg text-gray-300 leading-relaxed">
          All in one seamless platform. Stellopay ensures secure, instant salary payments without the complexity.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Featured card - Low Fees */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-md bg-[#8EB6FF] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-white">
              {benefits[0].icon}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">{benefits[0].title}</h3>
            <p className="text-gray-700 leading-relaxed">{benefits[0].description}</p>
          </div>
        </div>

        {/* Bottom two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {benefits.slice(1).map((benefit, index) => (
            <div key={index} className="bg-transparent border border-blue-500/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-white">
                {benefit.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">{benefit.title}</h3>
              <p className="text-gray-300 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
