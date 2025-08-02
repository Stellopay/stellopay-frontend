"use client";
import Image from "next/image";

const historyPayment = [
    {paymentDescription: "Payment Sent", paymentId: ' #TXN12345', history: "Your payment of 250 XLM to..."},
    {paymentDescription: "Payment Received", paymentId: ' #TXN12345', history: "You've received 500 USDC.... "},
    {paymentDescription: "Low Balance Alert", paymentId: '', history: "Your balance is below 50 XLM. Consider adding..."}
]

export default function PaymentHistory() {
  return (
    <div className="max-w-[23rem] h-[15.5rem] gap-4 mt-3.5">
    <div className='flex flex-col gap-3.5'>
        {historyPayment.map((history, index) => (
            <div key={`${history.paymentDescription}-${index}`}>
              <div className='w-full h-[4.5rem] font-[Inter] text-sm align-middle gap-2.5 py-3 px-6 border border-[#2D2D2D] rounded-md text-[#E5E5E5] flex'>
                <div className="">
                  {history.paymentDescription}
                    <div className='font-[Inter] font-medium text-xs align-middle text-[#535353]'> 
                      {history.paymentId}
                      <span>
                        {history.history}
                      </span>  
                    </div> 
                    </div>

                     <div className='w-6 h-6 border-[0.75px] relative border-[#2E2E2E] rounded-[6px] flex justify-center items-center'>
                      <Image src='/notification.png' alt="notify" width={24} height={24} className="w-4 h-4 object-contain"/>
                       <span className="w-1 h-1 absolute -top-0.5 -right-0.5 bg-[#EB6945] rounded-full"></span>
                      </div>     
              </div>
             
            </div>
        ))}
    </div>
    </div>
  )
}

 