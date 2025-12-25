"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import AccountSummary from "@/components/dashboard/account-summary";
import ContractSetupCard from "@/components/dashboard/contract-setup-card";
import ClientAnalyticsView from "@/components/analytics/client-analytics-view";
import NotificationPanel from "@/components/common/notification-panel";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Pagination } from "@/components/transactions/pagination";
import { Button } from "@/components/ui/button";
import { getPageItems, getTotalPages } from "@/utils/paginationUtils";
import { apiGet } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";
import type { TransactionProps } from "@/types/transaction";
import type { NotificationItem } from "@/types/notification-item";

const page = () => {
  const router = useRouter();
  const { address } = useWallet();
  const [transactions, setTransactions] = useState<TransactionProps[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Fetch transactions and notifications
  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [txData, notifData] = await Promise.all([
          apiGet<{ transactions: TransactionProps[] }>(`/transactions/${address}?limit=50`).catch((e) => {
            console.error("[dashboard] Failed to fetch transactions:", e);
            return { transactions: [] };
          }),
          apiGet<{ notifications: Array<{ title: string; message: string; read: boolean }> }>(`/notifications/${address}?limit=50`).catch((e) => {
            console.error("[dashboard] Failed to fetch notifications:", e);
            return { notifications: [] };
          }),
        ]);
        
        console.log("[dashboard] Fetched data:", { 
          transactions: txData.transactions?.length || 0, 
          notifications: notifData.notifications?.length || 0 
        });
        
        setTransactions(txData.transactions || []);
        setNotifications(notifData.notifications || []);
      } catch (e) {
        console.error("[dashboard] Failed to fetch data:", e);
        setTransactions([]);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  const paginatedTransactions = getPageItems(transactions, currentPage, itemsPerPage);
  const totalPages = getTotalPages(transactions.length, itemsPerPage);

  const handleViewAllTransactions = () => {
    router.push("/transactions");
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader pageTitle="Dashboard" />
      <main className="px-4 md:px-10 pt-6 pb-8 space-y-6">
        <AccountSummary />
        <ContractSetupCard />

        <div className="flex flex-col md:flex-row justify-between w-full gap-6">
          <div className="flex-[1.3] min-w-0">
            <ClientAnalyticsView />
          </div>

          <div className="flex-[0.7] min-w-0">
            <NotificationPanel notifications={notifications} />
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <div className="bg-foreground border rounded-[1.5rem] border-[#2D2D2D] p-2">
            <div className="grid pb-2 md:pb-0 md:flex items-center justify-between">
              <h6 className="text-xl font-medium mb-4 p-2 flex gap-1 items-center">
                <div className=" bg-[#121212] rounded-lg border border-[#2E2E2E] p-1">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.9999 10.5V9.99995C18.9999 6.22876 18.9998 4.34311 17.8283 3.17154C16.6567 2 14.7711 2 10.9999 2C7.22883 2 5.3432 2.00006 4.17163 3.17159C3.00009 4.34315 3.00007 6.22872 3.00004 9.99988L3 14.5C2.99997 17.7874 2.99996 19.4312 3.90788 20.5375C4.07412 20.7401 4.25986 20.9258 4.46243 21.0921C5.56877 22 7.21249 22 10.4999 22"
                      stroke="#E5E5E5"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 7H15M7 11H11"
                      stroke="#E5E5E5"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 18.5L16.5 17.95V15.5M12 17.5C12 19.9853 14.0147 22 16.5 22C18.9853 22 21 19.9853 21 17.5C21 15.0147 18.9853 13 16.5 13C14.0147 13 12 15.0147 12 17.5Z"
                      stroke="#E5E5E5"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span>Transaction History</span>
              </h6>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleViewAllTransactions}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[#2D2D2D] text-white hover:bg-[#2D2D2D] hover:text-white px-4 py-2"
                >
                  View All
                </Button>
              </div>
            </div>
            {loading ? (
              <div className="py-8 text-center text-[#A0A0A0]">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-[#A0A0A0]">No transactions found</div>
            ) : (
              <TransactionsTable transactions={paginatedTransactions} />
            )}
          </div>
          {transactions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={transactions.length}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default page;
