export default function TransactionHeader({ pageTitle }: { pageTitle: string }) {
  return (
    <div className="w-full px-4 md:px-6 py-4 bg-[#1a0c1d] ">
      <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="pl-4">
          <h1 className="text-white text-xl font-semibold">{pageTitle}</h1>
          </div>
      </div>
        <div className="w-full h-px bg-[#fff] mt-2"></div>
    </div>
  );
}