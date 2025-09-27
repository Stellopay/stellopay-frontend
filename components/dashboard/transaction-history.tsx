import Image from "next/image";
import Link from 'next/link';

interface PaymentType {
  paymentStatus: string;
}

interface PaymentId {
  id: string;
}

interface HeaderItem {
  title: string;
  paymentType?: PaymentType[];
  paymentId?: PaymentId[];
}

const headerTitle: HeaderItem[] = [
  { 
    title: "Transaction type",
    paymentType: [
      {paymentStatus: "Payment Sent"},
      {paymentStatus: "Payment Received"},
      {paymentStatus: "Payment Sent"},
      {paymentStatus: "Payment Received"},
      {paymentStatus: "Payment Sent"},
      {paymentStatus: "Payment Received"}
    ],
    paymentId: [
      {id: "#TXN12345"},
      {id: "#TXN12346"},
      {id: "#TXN12347"},
      {id: "#TXN12348"},
      {id: "#TXN12349"},
      {id: "#TXN12350"}
    ],
  },
  {title: "Address"},
  {title: "Date"},
  {title: "Token"},
  {title: "Amount"},
  {title: "Status"}
];


const sampleData = {
  address: ["GABCDE...XYZ67890","0xA1B2...C3D4E5", "GABCDE...XYZ67890", "0xA1B2...C3D4E5","GABCDE...XYZ67890","0xA1B2...C3D4E5"],
  dates: ["Apr 12, 2023 | 09:32AM", "Apr 12, 2023 | 09:32AM", "Apr 12, 2023 | 09:32AM", "Apr 12, 2023 | 09:32AM", "Apr 12, 2023 | 09:32AM", "Apr 12, 2023 | 09:32AM"],
  tokens: ["USDC", "XLM", "USDC", "XLM", "USDC", "XLM"],
  amounts: ["0.005", "0.25", "100.00", "0.003", "0.15", "50.00"],
  statuses: ["Completed", "Pending", "Completed", "Failed", "Completed", "Pending"]
};

const tokenIconMapWithUrls: Record<string, string> = {
  USDC: "/usd.png",
  XLM: "/stellar.png",
};

const TransactionTable: React.FC = () => {
  const transactionTypeData = headerTitle.find(item => item.title === "Transaction type");
  const transactionCount = transactionTypeData?.paymentType?.length || 0;

  return (
    <div className="max-w-full h-[35.375rem] rounded-md p-3 border border-[#2D2D2D] my-6">
      <div className='max-w-full h-9 flex justify-between'>
        <div className='w-[368px] h-9 inline-flex items-center align-middle'>
               <svg width="20" height="20" className="ml-3" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.8333 8.75V8.3333C15.8333 5.19064 15.8332 3.61926 14.857 2.64296C13.8806 1.66667 12.3093 1.66667 9.16662 1.66667C6.02403 1.66667 4.45267 1.66672 3.47636 2.643C2.50008 3.6193 2.50006 5.1906 2.50003 8.33324L2.5 12.0833C2.49998 14.8228 2.49997 16.1927 3.25657 17.1146C3.3951 17.2834 3.54988 17.4382 3.71869 17.5768C4.64064 18.3333 6.01041 18.3333 8.74995 18.3333" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.83325 5.83333H12.4999M5.83325 9.16666H9.16659" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 15.4167L13.75 14.9583V12.9167M10 14.5833C10 16.6544 11.6789 18.3333 13.75 18.3333C15.8211 18.3333 17.5 16.6544 17.5 14.5833C17.5 12.5122 15.8211 10.8333 13.75 10.8333C11.6789 10.8333 10 12.5122 10 14.5833Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>   
           <h1 className='w-[148px] font-[Inter] text-base align-middle text-[#E5E5E5'>Transaction History</h1>
        </div>
            <Link href='/'>
              <h3 className='w-[87px] h-9 rounded-[8px] p-2 border border-[#2E2E2E] bg-[#121212] text-[#E5E5E5] flex justify-center items-center'>
                View All
              </h3>
            </Link>
      </div>

      <table className="w-full h-[482px] border rounded-2xl mt-3.5">
        <thead className="rounded-[12px] w-full">
          <tr className="bg-[#191919]">
            {headerTitle.map((header, index) => (
              <th 
                key={index}
                className="w-fit xl:w-[294px] h-11 py-3 px-6 font-[Inter] text-start font-medium text-xs bg-[#191919] text-[#FFFFFF]">{header.title}
              </th>  
            ))}
          </tr>
        </thead>
        <tbody className="bg-[#0D0D0D80]">
          {Array.from({ length: transactionCount }, (_, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-[#191919] hover:text-yellow-500">
              {headerTitle.map((header, colIndex) => (
                <td key={colIndex} className="whitespace-nowrap text-sm text-[#D7E0EF] border border-[#2D333E]">
                  {header.title === "Transaction type" && (
                    <div className='w-fit xl:w-[180px] h-[72px] py-4 px-6'>
                      <div className="font-medium text-sm font-[Inter] text-[#D7E0EF]">
                        {transactionTypeData?.paymentType?.[rowIndex]?.paymentStatus}
                      </div>
                      <div className="text-[#FFFFFF] text-sm font-[Inter]">
                        {transactionTypeData?.paymentId?.[rowIndex]?.id}
                      </div>
                    </div>
                  )}
                  {header.title === "Address" && (<div className="max-w-fit xl:max-w-[224px] h-[72px] text-center flex items-center pl-4">{sampleData.address[rowIndex]}</div>)}
                  { header.title === "Date" && (<div className='max-w-fit xl:max-w-[224px] h-[72px] text-center flex items-center pl-4'>{sampleData.dates[rowIndex]}</div>)}
                 
                  {header.title === "Token" && (
                    <div className='max-w-[120px] h-[72px] text-center flex items-center pl-4 gap-3'>
                      {tokenIconMapWithUrls[sampleData.tokens[rowIndex]] && (
                        <Image
                          src={tokenIconMapWithUrls[sampleData.tokens[rowIndex]]}
                          alt={`${sampleData.tokens[rowIndex]} icon`}
                          width={24}
                          height={24}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <span>{sampleData.tokens[rowIndex]}</span>
                    </div>
                  )}
                 
                  {header.title === "Amount" && (<div className='max-w-[160px] text-center flex items-center pl-4'>{sampleData.amounts[rowIndex]}</div>)}
                  {header.title === "Status" && (
                    <span className={`px-2 py-1 text-sm font-medium font-[Inter] rounded-[12px] max-w-[160px] mx-6 ${
                      sampleData.statuses[rowIndex] === "Completed" ? "bg-[#102B19] text-green-800" :
                      sampleData.statuses[rowIndex] === "Pending" ? "bg-[#191919] text-yellow-800" :
                      "bg-[#1A1A1A] text-red-800"
                    }`}>
                      {sampleData.statuses[rowIndex]}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
