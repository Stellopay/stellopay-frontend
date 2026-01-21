import Image from "next/image";
import Link from "next/link";
import { HeroContent } from "@/types/landing";
export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[100vh] bg-gradient-to-b from-[#080509] to-[#181028] text-white px-4 pt-32 md:pt-52">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="flex flex-col text-4xl md:text-6xl font-bold font-clash leading-tight mb-4">
            <span>{HeroContent.titleOne}</span>
            <span>{HeroContent.titleTwo}</span>
          </h1>
          <p className="text-base md:text-lg text-[#bdb6c9] mb-8">
            {HeroContent.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-12">
            <Link href="/dashboard" passHref className="w-fit inline-flex">
              <button className="bg-[#598EFF] hover:bg-[#598EFF]/80 text-white font-semibold py-3 px-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#5b5bf6] focus:ring-offset-2 cursor-pointer w-fit">
                {HeroContent.button}
              </button>
            </Link>
            <button className="border border-[#598EFF] text-[#FFFFFF] hover:bg-[#23213a] font-semibold py-3 px-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#5b5bf6] focus:ring-offset-2 cursor-pointer w-fit">
              {HeroContent.buttonSecondary}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-center w-full mt-4 md:mt-8">
        {/* Center cards */}
        <div className="z-10 w-full md:w-[50%] overflow-hidden aspect-[3.2/1]">
          <Image
            src={HeroContent.image}
            alt={HeroContent.imageAlt}
            width={HeroContent.imageWidth}
            height={HeroContent.imageHeight}
            className="w-full h-auto shadow-xl object-top"
            priority
          />
        </div>
      </div>
    </section>
  );
}
