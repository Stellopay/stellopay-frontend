"use client";

import TransactionHeader from "@/components/dashboard/transaction-header";
import Navbar from "@/components/common/navbar";
import React, { useEffect, useState } from "react";
import { SideBar } from "@/components/common/side-bar";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Pagination } from "@/components/transactions/pagination";
import { transactions as allTransactions } from "@/public/data/mock-data";
import TableSearchbar from "@/components/transactions/table-searchbar";
import Filter from "@/components/transactions/filter";
import Sort from "@/components/transactions/sort";
import Date from "@/components/transactions/date";

const Transactions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useState("");
  const itemsPerPage = 6;

  // /search functionality
  const filteredTransactions = allTransactions.filter((transaction) =>
    Object.values(transaction).some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(searchParams.toLowerCase())
    )
  );
  const transactionsToShow = searchParams
    ? filteredTransactions
    : allTransactions;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const transactions = transactionsToShow.slice(startIndex, endIndex);
  const totalPages = Math.ceil(transactionsToShow.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  return (
    <>
      <main className="">      
        <TransactionHeader pageTitle="Transaction" />
        <div className="container mx-auto py-8 px-8">
          <div className="bg-foreground border rounded-[1.5rem] border-[#2D2D2D] p-2">
            {" "}
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
                <span> All Transactions</span>
              </h6>
              <div className="flex items-center gap-2">
                <TableSearchbar onSearch={setSearchParams} />
                <Filter />
                <Sort />
              </div>
            </div>
            <TransactionsTable transactions={transactions} />
            {searchParams && transactionsToShow.length === 0 && (
              <div className="text-center text-gray-400 py-4">
                No Transactions Found
              </div>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}            
            onPageChange={setCurrentPage}
            totalItems={transactionsToShow?.length}
          />
        </div>
      </main>
    </>
  );
};

export default Transactions;
