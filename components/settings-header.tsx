export default function SettingsHeader({
  pageTitle,
}: {
  pageTitle: string;
}) {
  return (
    <div className="w-full px-4 md:px-6 pt-4  border-b border-[#1A1A1A]">
      <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start justify-start gap-4">
        <h1 className="text-white text-2xl font-semibold pl-4">{pageTitle}</h1>
      </div>
    </div>
  );
}
