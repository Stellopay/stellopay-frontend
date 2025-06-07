export interface TransactionProps {
  id: string;
  type: string;
  address: string;
  date: string;
  time: string;
  token: string;
  amount: string;
  status: "Completed" | "Pending" | "Failed";
  tokenIcon: string;
}
