"use client";

import React from "react";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Bell,
  HelpCircle,
} from "lucide-react";

export default function TransactionTable() {
  const [startDate, setStartDate] = useState("28-03-2023");
  const [endDate, setEndDate] = useState("01-03-2023");

  const [transactions, setTransactions] = useState([
    {
      id: "TXTN12343",
      type: "Payment Sent",
      address: "0xAIB2...CJDEHS",
      date: "Apr 12, 2023",
      time: "09:32AM",
      token: "USDC",
      amount: "-$407.87",
      status: "Completed",
    },
    {
      id: "TXTN12345",
      type: "Payment Received",
      address: "0xBCDE...XYZ67890",
      date: "Apr 12, 2023",
      time: "09:32AM",
      token: "XLM",
      amount: "+$107.07",
      status: "Completed",
    },
    {
      id: "TXTN12344",
      type: "Payment Sent",
      address: "0xAIB2...CJDEHS",
      date: "Apr 12, 2023",
      time: "09:32AM",
      token: "USDC",
      amount: "-$300.00",
      status: "Pending",
    },
    {
      id: "TXTN12341",
      type: "Payment Received",
      address: "0xBCDE...XYZ67890",
      date: "Apr 12, 2023",
      time: "09:32AM",
      token: "XLM",
      amount: "+$2,000.00",
      status: "Completed",
    },
    {
      id: "TXTN12345",
      type: "Payment Sent",
      address: "0xAIB2...CJDEHS",
      date: "Apr 12, 2023",
      time: "09:33AM",
      token: "USDC",
      amount: "-$407.87",
      status: "Failed",
    },
    {
      id: "TXTN12345",
      type: "Payment Received",
      address: "0xBCDE...XYZ67890",
      date: "Apr 12, 2023",
      time: "09:32AM",
      token: "XLM",
      amount: "+$2,000.00",
      status: "Completed",
    },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);

  const getStatusClass = (status: string): string => {
    switch (status) {
      case "Completed":
        return "text-green-500 bg-green-500/10";
      case "Pending":
        return "text-yellow-500 bg-yellow-500/10";
      case "Failed":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  const getTokenIcon = (token: string): JSX.Element | null => {
    if (token === "USDC") {
      return (
        <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mr-2">
          <span className="text-white text-xs">$</span>
        </div>
      );
    } else if (token === "XLM") {
      return (
        <div className="h-5 w-5 rounded-full bg-gray-700 flex items-center justify-center mr-2">
          <span className="text-white text-xs">X</span>
        </div>
      );
    }
    return null;
  };

  const getAmountClass = (amount: string): string => {
    return amount.startsWith("+") ? "text-green-500" : "text-white";
  };

  return (
    <div className="flex flex-col bg-[#1E1225] text-white rounded-xl w-full max-w-6xl border-b border-gray-800">
      {/* Navigation Bar */}
      <div className="w-full bg-[#1E1225] px-4 py-3 flex items-center justify-between">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search here..."
            className="h-10 border border-gray-700 rounded-md bg-[#1E1225] pl-16 pr-4 py-2.5 text-sm text-gray-300 focus:outline-none w-64"
          />
        </div>
        <div className="flex items-center space-x-5">
          <div className="relative">
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <HelpCircle className="h-5 w-5 text-gray-400" />
          <div className="h-8 w-8 rounded-full bg-orange-500 overflow-hidden">
            <img
              src="/api/placeholder/36/36"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-3 border-b border-gray-800 space-y-4 md:space-y-0 bg-[#1E1225]">
        <h1 className="text-lg font-medium text-white">Transactions</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <button className="p-1 hover:bg-gray-800 rounded">
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
          <div className="flex items-center space-x-2 border border-gray-700 rounded-lg px-3 py-1.5 w-full sm:w-auto">
            <span className="text-sm text-gray-300">{startDate}</span>
            <span className="text-sm text-gray-500">To</span>
            <span className="text-sm text-gray-300">{endDate}</span>
            <Calendar size={14} className="text-gray-400 ml-2" />
          </div>
          <button className="p-1 hover:bg-gray-800 rounded">
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* All Transactions and SearchFilterSort - Changed background to #101010 and added border */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 space-y-4 md:space-y-0 bg-[#101010] border-x border-solid border-gray-800">
        <h2 className="text-lg font-medium flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="6"
              width="18"
              height="15"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
            <path
              d="M8 3V7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M16 3V7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          All Transactions
        </h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <button className="border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-1 rounded-md flex items-center justify-center">
            <Search className="h-4 w-4 mr-1 text-gray-400" />
            Search
          </button>
          <button className="border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-1 rounded-md flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 7L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="2"
                y="3"
                width="20"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M2 7H22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Filter
          </button>
          <button className="border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-1 rounded-md flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 12H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 18H12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M18 10L22 14L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sort
          </button>
        </div>
      </div>

      {/* Table section - Added border-x and changed background */}
      <div className="overflow-x-auto px-6 bg-[#101010] border-x border-solid border-gray-800">
        <div className="border-x border-b border-gray-800 rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-800 bg-gray-800/50">
                <th className="px-6 py-3 font-medium">Transaction Type</th>
                <th className="px-6 py-3 font-medium">Address</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Token</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transactions.map((transaction, index) => (
                <tr key={index} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 border-r border-gray-800">
                    <div>
                      <div className="font-medium">{transaction.type}</div>
                      <div className="text-sm text-gray-400">
                        {transaction.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm border-r border-gray-800">
                    {transaction.address}
                  </td>
                  <td className="px-6 py-4 text-sm border-r border-gray-800">
                    {transaction.date} | {transaction.time}
                  </td>
                  <td className="px-6 py-4 border-r border-gray-800">
                    <div className="flex items-center">
                      {getTokenIcon(transaction.token)}
                      {transaction.token}
                    </div>
                  </td>
                  <td
                    className={`px-6 py-4 border-r border-gray-800 ${getAmountClass(transaction.amount)}`}
                  >
                    {transaction.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(transaction.status)}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination section - Added border-x and changed background */}
      <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-400 bg-[#101010] border-x border-b border-solid border-gray-800">
        <div>Showing 1 to 6 of 17 items</div>
        <div className="flex items-center space-x-1">
          <button className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 text-white">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400">
            2
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400">
            3
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
