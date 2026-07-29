import Image from "next/image";
import Link from "next/link";

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
      { paymentStatus: "Payment Sent" },
      { paymentStatus: "Payment Received" },
      { paymentStatus: "Payment Sent" },
      { paymentStatus: "Payment Received" },
      { paymentStatus: "Payment Sent" },
      { paymentStatus: "Payment Received" },
    ],
    paymentId: [
      { id: "#TXN12345" },
      { id: "#TXN12346" },
      { id: "#TXN12347" },
      { id: "#TXN12348" },
      { id: "#TXN12349" },
      { id: "#TXN12350" },
    ],
  },
  { title: "Address" },
  { title: "Date" },
  { title: "Token" },
  { title: "Amount" },
  { title: "Status" },
];

const sampleData = {
  address: [
    "GABCDE...XYZ67890",
    "0xA1B2...C3D4E5",
    "GABCDE...XYZ67890",
    "0xA1B2...C3D4E5",
    "GABCDE...XYZ67890",
    "0xA1B2...C3D4E5",
  ],
  dates: [
    "Apr 12, 2023 | 09:32AM",
    "Apr 12, 2023 | 09:32AM",
    "Apr 12, 2023 | 09:32AM",
    "Apr 12, 2023 | 09:32AM",
    "Apr 12, 2023 | 09:32AM",
    "Apr 12, 2023 | 09:32AM",
  ],
  tokens: ["USDC", "XLM", "USDC", "XLM", "USDC", "XLM"],
  amounts: ["0.005", "0.25", "100.00", "0.003", "0.15", "50.00"],
  statuses: [
    "Completed",
    "Pending",
    "Completed",
    "Failed",
    "Completed",
    "Pending",
  ],
};

const tokenIconMapWithUrls: Record<string, string> = {
  USDC: "/usd.png",
  XLM: "/stellar.png",
};

const TransactionTable: React.FC = () => {
  const transactionTypeData = headerTitle.find(
    (item) => item.title === "Transaction type",
  );
  const transactionCount = transactionTypeData?.paymentType?.length || 0;

  return (
    <div className="w-full bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 transition-colors shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-zinc-600 dark:text-zinc-400"
            >
              <path
                d="M15.8333 8.75V8.3333C15.8333 5.19064 15.8332 3.61926 14.857 2.64296C13.8806 1.66667 12.3093 1.66667 9.16662 1.66667C6.02403 1.66667 4.45267 1.66672 3.47636 2.643C2.50008 3.6193 2.50006 5.1906 2.50003 8.33324L2.5 12.0833C2.49998 14.8228 2.49997 16.1927 3.25657 17.1146C3.3951 17.2834 3.54988 17.4382 3.71869 17.5768C4.64064 18.3333 6.01041 18.3333 8.74995 18.3333"
                stroke="currentColor"
                strokeWidth={1.25}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.83325 5.83333H12.4999M5.83325 9.16666H9.16659"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 15.4167L13.75 14.9583V12.9167M10 14.5833C10 16.6544 11.6789 18.3333 13.75 18.3333C15.8211 18.3333 17.5 16.6544 17.5 14.5833C17.5 12.5122 15.8211 10.8333 13.75 10.8333C11.6789 10.8333 10 12.5122 10 14.5833Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Transaction History
          </h2>
        </div>
        <Link href="/">
          <button className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
            View All
          </button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
              {headerTitle.map((header, index) => (
                <th
                  key={index}
                  className="pb-4 px-4 text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider"
                >
                  {header.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {Array.from({ length: transactionCount }, (_, rowIndex) => (
              <tr
                key={rowIndex}
                className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
              >
                {headerTitle.map((header, colIndex) => (
                  <td key={colIndex} className="py-4 px-4 whitespace-nowrap">
                    {header.title === "Transaction type" && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {
                            transactionTypeData?.paymentType?.[rowIndex]
                              ?.paymentStatus
                          }
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          {transactionTypeData?.paymentId?.[rowIndex]?.id}
                        </span>
                      </div>
                    )}
                    {header.title === "Address" && (
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {sampleData.address[rowIndex]}
                      </span>
                    )}
                    {header.title === "Date" && (
                      <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                        {sampleData.dates[rowIndex]}
                      </span>
                    )}

                    {header.title === "Token" && (
                      <div className="flex items-center gap-2">
                        {tokenIconMapWithUrls[sampleData.tokens[rowIndex]] && (
                          <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1 flex items-center justify-center">
                            <Image
                              src={
                                tokenIconMapWithUrls[
                                  sampleData.tokens[rowIndex]
                                ]
                              }
                              alt={`${sampleData.tokens[rowIndex]} icon`}
                              width={16}
                              height={16}
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                        )}
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                          {sampleData.tokens[rowIndex]}
                        </span>
                      </div>
                    )}

                    {header.title === "Amount" && (
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        {sampleData.amounts[rowIndex]}
                      </span>
                    )}
                    {header.title === "Status" && (
                      <div
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sampleData.statuses[rowIndex] === "Completed"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : sampleData.statuses[rowIndex] === "Pending"
                              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {sampleData.statuses[rowIndex]}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
