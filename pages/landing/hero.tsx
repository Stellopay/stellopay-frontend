import Image from "next/image";
import Link from "next/link";
import { HeroContent } from "@/types/landing";
export default function Hero() {

  // top-right -  background: linear-gradient(180deg, #512DA4 0%, #A818B6 100%); - width: 350.0000290454993; height: 935.0000775929766; angle: -56.9 deg; opacity: 0.1;

  // top-left - background: linear-gradient(180deg, #512DA4 0%, #A818B6 100%); - width: 350.0000290454993; height: 935.0000775929766; angle: 56.9 deg; opacity: 0.1;

  // bottom-left - background: #1B43F5; backdrop-filter: blur(224px); - width: 350.0000290454993; height: 935.0000775929766; angle: 130 deg; opacity: 0.1;

  // bottom-right - background: #1B43F5; backdrop-filter: blur(224px); - width: 350.0000290454993; height: 935.0000775929766; angle: -123.9 deg; opacity: 0.1;


  return (
    <section className="relative flex flex-col items-center justify-center min-h-[100vh] bg-gradient-to-b from-[#080509] to-[#181028] text-white px-4 pt-32 md:pt-52 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Top V Formation (V facing up) */}
        {/* Top Right arm */}
        <div
          className="absolute top-1/2 left-1/2 opacity-[0.1] blur-[224px]"
          style={{
            width: '350px',
            height: '935px',
            background: 'linear-gradient(180deg, #512DA4 0%, #A818B6 100%)',
            transformOrigin: 'bottom center',
            transform: 'translate(-50%, -100%) rotate(56.9deg)',
          }}
        />
        {/* Top Left arm */}
        <div
          className="absolute top-1/2 left-1/2 opacity-[0.1] blur-[224px]"
          style={{
            width: '350px',
            height: '935px',
            background: 'linear-gradient(180deg, #512DA4 0%, #A818B6 100%)',
            transformOrigin: 'bottom center',
            transform: 'translate(-50%, -100%) rotate(-56.9deg)',
          }}
        />

        {/* Bottom V Formation (V facing down) */}
        <div
          className="absolute top-1/2 left-1/2 opacity-[0.1] blur-[224px]"
          style={{
            width: '350px',
            height: '935px',
            background: '#1B43F5',
            transformOrigin: 'top center',
            transform: 'translate(-50%, 0%) rotate(32deg)',
          }}
        />

        {/* Left arm */}
        <div
          className="absolute top-1/2 left-1/2 opacity-[0.1] blur-[224px]"
          style={{
            width: '350px',
            height: '935px',
            background: '#1B43F5',
            transformOrigin: 'top center',
            transform: 'translate(-50%, 0%) rotate(-32deg)',
          }}
        />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center">
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

      <div className="relative z-10 flex items-end justify-center w-full mt-4 md:mt-8">
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
