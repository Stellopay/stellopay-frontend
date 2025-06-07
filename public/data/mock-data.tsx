// export const invoices = [
//     {
//       invoice: "INV001",
//       paymentStatus: "Paid",
//       totalAmount: "$250.00",
//       paymentMethod: "Credit Card",
//     },
//     {
//       invoice: "INV002",
//       paymentStatus: "Pending",
//       totalAmount: "$150.00",
//       paymentMethod: "PayPal",
//     },
//     {
//       invoice: "INV003",
//       paymentStatus: "Unpaid",
//       totalAmount: "$350.00",
//       paymentMethod: "Bank Transfer",
//     },
//     {
//       invoice: "INV004",
//       paymentStatus: "Paid",
//       totalAmount: "$450.00",
//       paymentMethod: "Credit Card",
//     },
//     {
//       invoice: "INV005",
//       paymentStatus: "Paid",
//       totalAmount: "$550.00",
//       paymentMethod: "PayPal",
//     },
//     {
//       invoice: "INV006",
//       paymentStatus: "Pending",
//       totalAmount: "$200.00",
//       paymentMethod: "Bank Transfer",
//     },
//     {
//       invoice: "INV007",
//       paymentStatus: "Unpaid",
//       totalAmount: "$300.00",
//       paymentMethod: "Credit Card",
//     },
//   ]

import { TransactionProps } from "@/lib/interface";

export const transactions: TransactionProps[] = [
  {
    id: "TXN12345",
    type: "Payment Sent",
    address: "0xA1B2...C3D4E5",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "USDC",
    amount: "-$607.87",
    status: "Completed",
    tokenIcon: "/usd.png"
  },
  {
    id: "TXN12345",
    type: "Payment Received",
    address: "GABCDE...XYZ67890",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "XLM",
    amount: "+$307.07",
    status: "Completed",
    tokenIcon: "/stellar.png"
  },
  {
    id: "TXN12345",
    type: "Payment Sent",
    address: "0xA1B2...C3D4E5",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "USDC",
    amount: "-$300.00",
    status: "Pending",
    tokenIcon: "/usd.png"
  },
  {
    id: "TXN12345",
    type: "Payment Received",
    address: "GABCDE...XYZ67890",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "XLM",
    amount: "+$2000.00",
    status: "Completed",
    tokenIcon: "/stellar.png"
  },
  {
    id: "TXN12345",
    type: "Payment Sent",
    address: "0xA1B2...C3D4E5",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "USDC",
    amount: "-$607.87",
    status: "Failed",
    tokenIcon: "/usd.png"
  },
  {
    id: "TXN12345",
    type: "Payment Received",
    address: "GABCDE...XYZ67890",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "XLM",
    amount: "+$2000.00",
    status: "Completed",
    tokenIcon: "/stellar.png"
  },
  {
    id: "TXN12345",
    type: "Payment Sent",
    address: "0xA1B2...C3D4E5",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "USDC",
    amount: "-$300.00",
    status: "Pending",
    tokenIcon: "/usd.png"
  },
  {
    id: "TXN12345",
    type: "Payment Received",
    address: "GABCDE...XYZ67890",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "XLM",
    amount: "+$2000.00",
    status: "Completed",
    tokenIcon: "/stellar.png"
  },
  {
    id: "TXN12345",
    type: "Payment Sent",
    address: "0xA1B2...C3D4E5",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "USDC",
    amount: "-$607.87",
    status: "Failed",
    tokenIcon: "/usd.png"
  },
  {
    id: "TXN12345",
    type: "Payment Received",
    address: "GABCDE...XYZ67890",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "XLM",
    amount: "+$2000.00",
    status: "Completed",
    tokenIcon: "/stellar.png"
  },
  {
    id: "TXN12345",
    type: "Payment Sent",
    address: "0xA1B2...C3D4E5",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "USDC",
    amount: "-$300.00",
    status: "Pending",
    tokenIcon: "/usd.png"
  },
  {
    id: "TXN12345",
    type: "Payment Received",
    address: "GABCDE...XYZ67890",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "XLM",
    amount: "+$2000.00",
    status: "Completed",
    tokenIcon: "/stellar.png"
  },
  {
    id: "TXN12345",
    type: "Payment Sent",
    address: "0xA1B2...C3D4E5",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "USDC",
    amount: "-$607.87",
    status: "Failed",
    tokenIcon: "/usd.png"
  },
  {
    id: "TXN12345",
    type: "Payment Received",
    address: "GABCDE...XYZ67890",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "XLM",
    amount: "+$2000.00",
    status: "Completed",
    tokenIcon: "/stellar.png"
  }
];
