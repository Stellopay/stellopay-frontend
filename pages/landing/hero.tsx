import Image from "next/image";
import { HeroContent } from "./content";
export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-b from-[#201322] to-[#181028] text-white px-4 pt-24">
      <div className="text-center">
        <h1 className="flex flex-col text-4xl md:text-6xl font-bold leading-tight mb-4">
          <span>{HeroContent.titleOne}</span>
          <span>{HeroContent.titleTwo}</span>
        </h1>
        <p className="text-base md:text-lg text-[#bdb6c9] mb-8">
          {HeroContent.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button className="bg-[#598EFF] hover:bg-[#598EFF]/80 text-white font-semibold py-3 px-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#5b5bf6] focus:ring-offset-2 cursor-pointer">
            {HeroContent.button}
          </button>
          <button className="border border-[#598EFF] text-[#FFFFFF] hover:bg-[#23213a] font-semibold py-3 px-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#5b5bf6] focus:ring-offset-2 cursor-pointer">
            {HeroContent.buttonSecondary}
          </button>
        </div>
      </div>

      <div className="flex items-end justify-center w-full mt-4 md:mt-8">
        {/* Center cards */}
        <div className="z-10 w-[60%] md:w-[50%] overflow-hidden h-[255px]">
          <Image
            src={HeroContent.image}
            alt={HeroContent.imageAlt}
            width={HeroContent.imageWidth}
            height={HeroContent.imageHeight}
            className="w-full h-auto shadow-xl"
            priority
          />
        </div>
      </div>
    </section>
  );
} 