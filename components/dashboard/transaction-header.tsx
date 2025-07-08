import Date from "../transactions/date";


export default function TransactionHeader({
  pageTitle,
}: {
  pageTitle: string;
}) {
  return (
    <div className="w-full px-4 md:px-6 pt-4  border-b border-[#1A1A1A]">
      <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-white text-2xl font-semibold pl-4">{pageTitle}</h1>
        <div className="flex items-center justify-between gap-4">
          <Date date="26-03-2025" /> <span className="text-sm">To</span>{" "}
          <Date date="26-03-2025" />
        </div>
      </div>
    </div>
  );
}
