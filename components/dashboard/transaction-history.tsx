import { CgLoadbarDoc } from "react-icons/cg";
import Image from "next/image";
import Link from 'next/link';

// Define types for better type safety
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

// Your data
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
  {title: "Date"},
  {title: "Token"},
  {title: "Amount"},
  {title: "Status"}
];

// Sample data for other columns (you can replace with your actual data)
const sampleData = {
  dates: ["Apr 12, 2023 | 09:32AM", "Apr 12, 2023 | 09:32AM", "Apr 12, 2023 | 09:32AM", "Apr 12, 2023 | 09:32AM", "Apr 12, 2023 | 09:32AM", "Apr 12, 2023 | 09:32AM"],
  tokens: ["USDC", "XLM", "USDC", "XLM", "USDC", "XLM"],
  amounts: ["0.005", "0.25", "100.00", "0.003", "0.15", "50.00"],
  statuses: ["Completed", "Pending", "Completed", "Failed", "Completed", "Pending"]
};

const tokenIconMapWithUrls: Record<string, string> = {
  USDC: "/usd.png",
  XLM: "/stellar.png", // Removed /public/ as Next.js serves from public root
};

const TransactionTable: React.FC = () => {
  // Get the transaction type data
  const transactionTypeData = headerTitle.find(item => item.title === "Transaction type");
  const transactionCount = transactionTypeData?.paymentType?.length || 0;

  return (
    <div className="max-w-[68.75rem] h-[35.375rem] rounded-md p-4 border border-[#2D2D2D] my-6">

      <div className='max-w-[1068px] h-9 flex justify-between'>
        <div className='w-[368px] h-9 inline-flex items-center align-middle'>
             <CgLoadbarDoc className='w-5 h-5 object-contain ml-3'/>
           <h1 className='w-[148px] font-[Inter] text-base align-middle text-[#E5E5E5'>Transaction History</h1>
        </div>
            <Link href='/'>
              <h3 className='w-[87px] h-9 rounded-[8px] p-2 border border-[#2E2E2E] bg-[#121212] text-[#E5E5E5] flex justify-center items-center'>
                View All
              </h3>
            </Link>
      </div>

      <table className="w-full h-[482px] border border-[] rounded-[12px] my-4">
        <thead className="rounded-[12px]">
          <tr className="bg-[#191919]">
            {headerTitle.map((header, index) => (
              <th 
                key={index}
                className="w-[294px] h-11 py-3 px-6 font-[Inter] text-start font-medium text-xs bg-[#191919] text-[#FFFFFF]">{header.title}
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
                    <div className='w-[294px] h-[73px] py-4 px-6'>
                      <div className="font-medium text-sm font-[Inter] text-[#D7E0EF]">
                        {transactionTypeData?.paymentType?.[rowIndex]?.paymentStatus}
                      </div>
                      <div className="text-[#FFFFFF] text-sm font-[Inter]">
                        {transactionTypeData?.paymentId?.[rowIndex]?.id}
                      </div>
                    </div>
                  )}
                  { header.title === "Date" && (<div className='max-w-[294px] h-[72px] py-4 px-6'>{sampleData.dates[rowIndex]}</div>)}
                 
                  {header.title === "Token" && (
                    <div className='max-w-[120px] h-[72px] py-4 px-6 flex items-center gap-3'>
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
                 
                  {header.title === "Amount" && (<div className='max-w-[200px] py-4 px-6'>{sampleData.amounts[rowIndex]}</div>)}
                  {header.title === "Status" && (
                    <span className={`px-2 py-1 text-sm font-medium font-[Inter] rounded-[12px] w-[160px] mx-6 ${
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
