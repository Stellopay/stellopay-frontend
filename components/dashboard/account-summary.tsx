'use client';

import Image from "next/image";

const summary = [
    {
        accountInfo: "Your Account Balance", 
        amount: "$ 2,432 USDC", 
        image: "/copy-01.png", 
        item: "Copy Address", 
        address: "BaDE1b23U45...67890UzZ",
        accountImage: "/piggy-bank.png" // Added PNG for account balance
    },
    {
        accountInfo: "Paid This Month", 
        amount: "$ 0", 
        item: "ITEMS", 
        address: "0",
        accountImage: "/dollar-02.png" // Added PNG for paid this month
    },
    {
        accountInfo: "To be Paid", 
        amount: "$ 0", 
        item: "ITEMS", 
        address: "0",
        accountImage: "/dollar-01.png" // Added PNG for to be paid
    }
]

export default function AccountSummary() {
    
  return (
    <div className="max-w-[68.75rem] p-4 rounded-xl h-[12.75rem] my-6 border-[1px] border-[#2D2D2D] bg-[#0D0D0D80]">
        <div className="w-full h-8 gap-3 mb-4 flex items-center">
            <div className="w-8 h-8 rounded-[8px] border border-[#2D2D2D] flex justify-center items-center">
                <Image src='/bank.png' alt="" width={24} height={24} className="w-6 h-6 object-contain"/>
            </div>
            <h1 className="font-[Inter] text-base leading-[145%] align-middle">Account Summary</h1>
        </div>

        <div className="max-w-[66.75rem] h-[7.5rem] gap-4 justify-between flex overflow-hidden">
            {summary.map((info, index) => (
                <div className="w-[21.58rem]" key={`${info.accountInfo}-${index}`}>
                    <div className="h-[7.5rem] py-4 px-6 border border-[#2E2E2E] rounded-xl">
                        <div className="w-full flex items-center gap-2 mb-2">
                            <div className="text-sm align-middle font-[Inter]">{info.accountInfo}</div>
                               <Image 
                                src={info.accountImage} 
                                alt={info.accountInfo} 
                                width={20} 
                                height={20} 
                                className="w-5 h-5 object-contain"
                            />
                        </div>
                        <div className="font-semibold text-2xl align-middle font-[Inter] mb-1">{info.amount}</div> 
                        <p className="max-w-[16.4375rem] h-[17px] flex items-center font-medium text-xs align-middle font-[Inter] text-[#3B3B3B]">
                            {info.item} : 
                            <span className="text-[#D8D8D8] cursor-pointer">{info.address}</span>
                            {info.image && (
                                <span>
                                    <Image 
                                        src={info.image} 
                                        alt='copy' 
                                        width={14} 
                                        height={14} 
                                        className="object-contain w-3.5 h-3.5 cursor-pointer ml-1"
                                    />
                                </span>
                            )}
                        </p> 
                    </div>
                </div>          
            ))}
        </div>
    </div>      
  )
}

// 'use client';

// import Image from "next/image";


// const summary = [
//     {accountInfo: "Your Account Balance", amount: "$ 2,432 USDC", image: "/copy-01.png", item: "Copy Address", address: "BaDE1b23U45...67890UzZ"},
//     {accountInfo: "Paid This Month", amount: "$ 0", item: "ITEMS", address: "0"},
//     {accountInfo: "To be Paid", amount: "$ 0", item: "ITEMS", address: "0"}
// ]



// export default function AccountSummary() {
    
//   return (
//     <div className="max-w-[68.75rem] p-4 rounded-xl h-[12.75rem] my-6 border-[1px]  border-[#2D2D2D] bg-[#0D0D0D80]">
//         <div className="w-full h-8 gap-3 mb-4  flex items-center">
//             <div className="w-8 h-8 rounded-[8px] border border-[#2D2D2D] flex justify-center items-center">
//                 <Image src='/bank.png' alt="" width={24} height={24} className="w-6 h-6 object-contain"/>
//             </div>
//             <h1 className="font-[Inter] text-base leading-[145%] align-middle">Account Summary</h1>
//         </div>

//             <div className="max-w-[66.75rem] h-[7.5rem] gap-4 justify-between flex overflow-hidden">
//                   {summary.map((info, index) => (
//                             <div className="w-[21.58rem]" key={`${info.accountInfo}-${index}`}>
//                               <div className=" h-[7.5rem] py-4 px-6 border border-[#2E2E2E] rounded-xl">
//                                 <div className="w-full text-sm align-middle font-[Inter]">{info.accountInfo}</div> 
//                                     <div className="font-semibold text-2xl align-middle font-[Inter]"> {info.amount}</div> 
//                                        <p className="max-w-[16.4375rem] h-[17px] gap-1 inline-flex font-medium text-xs align-middle font-[Inter] text-[#3B3B3B]">{info.item} : <span className="text-[#D8D8D8] cursor-pointer">{info.address}</span> 
//                                        {/* <span>  <Image src={info.image} alt='copy' width={24} height={24} className="object-contain w-3.5 h-3.5 cursor-pointer"/></span> */}
//                                        </p> 
//                                        </div>
//                              </div>          
//                         ))}
//             </div>
//     </div>      
//   )
// }
