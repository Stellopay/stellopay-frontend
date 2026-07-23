'use client'
import React from 'react'
import Image from 'next/image'
import { ArrowRight, CircleCheck, Shield, Sparkles, Wallet, Zap } from 'lucide-react'
import stellar from '../../public/stellar.png'
import skartnet from '../../public/StarknetIcon.png'
import { useReducedMotion } from '@/hooks/useReducedMotion'


interface Info {
  id: number;
  icon: React.ReactNode;
  label: string;
}

const infos : Info[] = [
  {
    id: 1,
    icon: <Zap className='w-3.5 lg:w-4 lg:h-4 h-3.5'/>,
    label: 'Instant Payments'
  },
  {
    id: 2,
    icon : <Shield className='w-3.5 lg:w-4 lg:h-4 h-3.5'/>,
    label: 'Military-Grade',
  },
  {
    id: 3,
    icon: <CircleCheck className='w-3.5 lg:w-4 lg:h-4 h-3.5'/>,
    label: 'Zero Fees'
  }
]

const escrowCardInfos = [
  {
    id: 1,
    label: 'Payrolls',
  }, 
  {
    id: 2,
    label: 'Escrow',
  }, 
  {
    id:3,
    label: 'Disputes'
  }
]

const InfoCard = ({children} : {children: React.ReactNode}) => {
  return (
    <div className='flex items-center justify-start gap-2 lg:gap-3 rounded-xl border-[0.74px] relative group border-[#e4e4e7] dark:border-[#27272A] w-full h-12.5 p-2.5 bg-[#FFFFFF] dark:bg-[#18181B]'>
      {children}
    </div>
  )
}

/**
 * Hero component rendering the top section of the landing page.
 * Implements optimized Next.js Image components for network logo assets
 * with explicit sizing to secure visual stability (CLS reduction) above the fold.
 *
 * Respects `prefers-reduced-motion: reduce` — decorative blur orbs and
 * rotated floating cards are hidden when the user has opted out of motion.
 * All content remains fully visible and functional either way.
 */
const Hero = () => {
  const reducedMotion = useReducedMotion()

  return (
    <section
      aria-label="Hero — The Future of Payroll on Blockchain"
      className='w-full min-h-screen text-[#09090B] dark:text-[#FAFAFA] flex items-center justify-center bg-white dark:bg-black relative'
    >

      {/* Decorative gradient orbs — hidden when reduced-motion is preferred */}
      {!reducedMotion && (
        <>
          <div className='absolute z-3 bg-gradient-to-br from-[#10B981] to-[#00000000] w-64.5 h-64.5 lg:w-99 lg:h-99 rounded-full opacity-20 lg:opacity-10 blur-3xl top-[80%] lg:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' aria-hidden="true"></div>
          <div className='absolute z-3 bg-gradient-to-br from-[#3B82F6] to-[#00000000] w-73.5 h-73.5 lg:w-99 lg:h-99 rounded-full opacity-20 lg:opacity-10 blur-3xl top-[10%] lg:top-[45%] left-[55%] lg:left-[45%] -translate-x-[45%] -translate-y-[45%]' aria-hidden="true"></div>
          <div className='absolute z-3 bg-gradient-to-br from-[#8B5CF6] to-[#00000000]  w-68 h-68 lg:w-121 lg:h-121 rounded-full opacity-20 lg:opacity-10 blur-3xl lg:top-[53%] left-[40%] lg:left-[53%] -translate-x-[53%] -translate-y-[53%] top-[25%]' aria-hidden="true"></div>
        </>
      )}

      <div className='h-full w-full flex flex-col lg:flex-row items-center justify-center font-[var(--font-sans)] lg:p-5 gap-12 lg:gap-6 my-30'>

        {/* first container */}
        <div className='flex flex-col w-[90%] md:w-[70%] lg:max-w-176 lg:max-h-168.5 h-auto relative gap-5'>
          {/* Simplifying Crypto Payments for Business card */}
          <a href="#" className='flex items-center justify-around rounded-full border-[0.74px] relative group border-[#e4e4e7] dark:border-[#27272A] w-78 h-7.5 px-1.5 bg-[#FFFFFF] dark:bg-[#18181B]'>
            <Sparkles className='text-[#09090B] dark:text-[#FAFAFA] w-[14.5px] h-[14.5px]' />
            <p className='font-medium text-xs'>
              Simplifying Crypto Payments for Business 
            </p>
          <ArrowRight className='text-[#52525B] dark:text-[#A1A1AA] w-[13.99px] h-[13.99px]'/>
          </a>
          {/* header text */}
          <h1 className='font-bold text-4xl lg:text-7xl'>
              The Future of
            <span className='bg-gradient-to-r from-[#2563EB] dark:from-[#3B82F6] via-[#7C3AED] dark:via-[#8B5CF6] via-16% lg:via-33% to-[#059669] dark:to-[#10B981] to-33% lg:to-66% bg-clip-text text-transparent block'>
              Payroll on
            </span>
              Blockchain
          </h1>
          {/* paragraph text */}
          <p className='text-base lg:text-lg font-normal text-[#52525B] dark:text-[#A1A1AA] lg:w-[90%]'>
            Built for modern businesses. Designed for global payments. Powered by blockchain technology.
          </p>
          {/* benefits and actions */}
          <div className='grid grid-cols-1 lg:grid-cols-3 items-center justify-between w-full gap-2 lg:gap-3'>
            {infos.map((info) => (
            <InfoCard key={info.id}>
              <div className='rounded-[12px] w-7 lg:w-8 h-7 lg:h-8 bg-gradient-to-r from-[#09090B1A] dark:from-[#FAFAFA1A] to-[#09090B0D] dark:to-[#FAFAFA0D] flex items-center justify-center'>
                {info.icon}
              </div>
              <span className='font-semibold text-xs inline'>
                {info.label}
              </span>
            </InfoCard>
            ))}
          </div>
          {/* buttons */}
          <div className='flex w-full lg:w-auto flex-col lg:flex-row gap-2 lg:gap-3'>
            <button
              type="button"
              className='bg-[#09090B] dark:bg-[#FAFAFA] rounded-[16px] lg:w-47 h-11 lg:h-12.5 p-3 text-[#FFFFFF] dark:text-[#09090B] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer'
            >
              <Wallet className='w-4 h-4' aria-hidden="true" />
              <span>Connect Wallet</span>
            </button>

            <button
              type="button"
              className='border-[0.74px] border-[#e4e4e7] dark:border-[#27272A] rounded-[16px] lg:w-38.5 h-11.5 lg:h-12.5 p-3 text-[#09090B] dark:text-[#FAFAFA] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer'
            >
              <span>Read Docs</span>
              <ArrowRight className='w-4 h-4' aria-hidden="true" />
            </button>
          </div>
        </div>
            

        {/* main card */}
        <div className='flex flex-col lg:border-2 w-[90%] md:w-[70%]  lg:max-w-176 lg:max-h-168.5 h-auto items-center justify-between gap-6 lg:gap-3 rounded-xl border-[1.34px] relative group border-[#e4e4e7] dark:border-[#27272A] min-h-12.5 p-6 bg-[#FFFFFF] dark:bg-[#18181B]' style={{boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}}>
          {/* top floating card — rotation disabled when reduced-motion is preferred */}
          <div className={`border-[1.47px] w-22.5 lg:w-23.5 h-22.25 lg:h-23.25 border-[#e4e4e7] dark:border-[#27272A] absolute z-2 bg-[#FFFFFF] dark:bg-[#18181B] rounded-[16px] -top-4 -right-4.5 flex flex-col justify-between items-center p-4 shadow-2xl lg:border-2 transform ${reducedMotion ? '' : 'rotate-8 dark:rotate-4'}`} style={{boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}}>
            <p className='text-[#09090B] dark:text-[#FAFAFA] text-3xl font-bold'>
              8
            </p>

            <p className='text-xs font-normal text-[#52525B] dark:text-[#A1A1AA]'>
              Payrolls
            </p>
          </div>
          {/* bottom floating card — rotation disabled when reduced-motion is preferred */}
          <div className={`border-[1.47px] w-20 lg:w-20.5 h-22.25 lg:h-22.75 border-[#e4e4e7] dark:border-[#27272A] absolute z-2 bg-[#FFFFFF] dark:bg-[#18181B] rounded-[16px] -bottom-7 -left-4 flex flex-col justify-between items-center p-4.5 lg:border-2 transform ${reducedMotion ? '' : '-rotate-8 dark:rotate-0'}`} style={{boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}}>
            <p className='text-[#09090B] dark:text-[#FAFAFA] text-3xl font-bold'>
              2s
            </p>

            <p className='text-xs font-normal text-[#52525B] dark:text-[#A1A1AA]'>
              Speed
            </p>
          </div>

          {/* first row */}
          <div className='text-[#52525B] dark:text-[#A1A1AA] flex justify-between items-center w-full'>
            <div className='flex items-center gap-3 '>
              <div className='bg-gradient-to-br from-[#2563EB] dark:from-[#3B82F6] via-[#7C3AED] dark:via-[#8B5CF6] to-[#059669] dark:to-[#10B981] w-12.5 h-12.5 rounded-[16px] flex items-center justify-center'>
                <Wallet className='w-6 h-6 text-[#FAFAFA]'/>
              </div>

              <div className=''>
                <p className=' text-xs font-normal text-[#52525B] dark:text-[#A1A1AA]'>
                  Escrow Dashboard
                </p>
                <h4 className='text-base font-bold'>
                  Multi-Chain Platform
                </h4>
              </div>
            </div>

            <div className='border-[#e4e4e7] dark:border-[#27272A] border-[1.34px] w-17.25 h-10 rounded-[16px] font-bold text-xs flex items-center justify-center lg:border-2'>
              <span className='text-base mb-0.75'>●</span> ACT
            </div>
          </div>
          {/* second row */}
          <div className='w-full'>
            <p className=' text-xs font-normal text-[#52525B] dark:text-[#A1A1AA]'>
              Total Locked in Escrow
            </p>

            <p className='text-[#09090B] dark:text-[#FAFAFA] text-4xl font-bold'>
              $847,500.00
            </p>

            <p className='text-[#09090B] dark:text-[#FAFAFA] text-xs font-semibold ml-4'>
              12 Active Contracts
            </p>
          </div>
          {/* third and fourth row */}
          <div className='w-full flex flex-col gap-4'>
            {/* third row */}
            <div className='flex justify-between items-center gap-3 text-[#52525B] dark:text-[#A1A1AA] font-bold text-xs w-full'>

            <a href="#" className='rounded-[16px] border-[#e4e4e7] dark:border-[#27272A] border-[1.34px] p-4 w-full h-33.5 flex flex-col justify-between lg:border-2'>
              <div className='flex justify-between items-center w-full'>
                <div className='bg-[#FFFFFF] dark:bg-[#18181B] w-10 h-10 rounded-[12px] flex justify-center items-center' style={{boxShadow: '0px 4px 20px 0px rgba(139, 92, 246, 0.25)'}}>
                  <Image src={stellar} alt="Stellar network" width={24} height={20} className='w-6 h-5'/>
                </div>
                <ArrowRight className='text-[#52525B] dark:text-[#A1A1AA] w-[13.99px] h-[13.99px]'/>
              </div>

              <p className='text-xs font-normal text-[#52525B] dark:text-[#A1A1AA]'>
                Stellar
              </p>

              <p className='text-[#09090B] dark:text-[#FAFAFA] text-lg font-bold'>
                $500k
              </p>
            </a>

            <a href="#" className='rounded-[16px] border-[#e4e4e7] dark:border-[#27272A] border-[1.34px] p-4 w-full h-33.5 flex flex-col justify-between lg:border-2'>
              <div className='flex justify-between items-center w-full'>
                <div className='bg-[#FFFFFF] dark:bg-[#18181B] w-10 h-10 rounded-[12px] flex justify-center items-center' style={{boxShadow: '0px 4px 20px 0px rgba(139, 92, 246, 0.25)'}}>
                  <Image src={skartnet} alt="Starknet network" width={24} height={20} className='w-6 h-5'/>
                </div>
                <ArrowRight className='text-[#52525B] dark:text-[#A1A1AA] w-[13.99px] h-[13.99px]'/>
              </div>

              <p className='text-xs font-normal text-[#52525B] dark:text-[#A1A1AA]'>
                Starknet
              </p>

              <p className='text-[#09090B] dark:text-[#FAFAFA] text-lg font-bold'>
                $347.5k
              </p>
            </a>
          </div>
          {/* fourth row */}
          <div className='flex justify-between items-center gap-3 text-[#52525B] dark:text-[#A1A1AA] font-bold text-xs w-full'>
            {escrowCardInfos.map((escrowCardInfo)=> (
              <div key={escrowCardInfo.id} className='border-[#e4e4e7] dark:border-[#27272A] border-[1.34px] h-11 w-full flex items-center justify-center rounded-[16px] lg:border-2'>
              {escrowCardInfo.label}
            </div>
            ))}
          </div>
          </div>
        </div>

      </div>

      
    </section>
  )
}

export default Hero
