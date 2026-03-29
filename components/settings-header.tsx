import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils/commonUtils";

export interface SettingsHeaderSection {
  value: string;
  label: string;
  description: string;
  badge?: string;
}

interface SettingsHeaderProps {
  pageTitle: string;
  pageDescription: string;
  sections: SettingsHeaderSection[];
  activeSection: string;
}

export default function SettingsHeader({
  pageTitle,
  pageDescription,
  sections,
  activeSection,
}: SettingsHeaderProps) {
  const currentSection =
    sections.find((section) => section.value === activeSection) ?? sections[0];

  return (
    <div className="w-full border-b border-zinc-200/80 bg-white/85 px-4 pt-4 backdrop-blur md:px-6 dark:border-white/10 dark:bg-[#09090B]/85">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-6 pb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <span className="inline-flex w-fit rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium tracking-[0.2em] text-zinc-600 uppercase dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
              Settings
            </span>
            <div className="space-y-1">
              <h1 className="font-general text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {pageTitle}
              </h1>
              <p className="max-w-2xl text-sm text-zinc-600 md:text-base dark:text-zinc-400">
                {pageDescription}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            <p className="font-medium text-zinc-900 dark:text-white">
              {currentSection?.label}
            </p>
            <p>{currentSection?.description}</p>
          </div>
        </div>

        <TabsList
          aria-label="Settings sections"
          className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-2 dark:border-white/10 dark:bg-white/5"
        >
          {sections.map((section) => (
            <TabsTrigger
              key={section.value}
              value={section.value}
              className={cn(
                "min-w-[160px] flex-none items-start rounded-2xl border border-transparent px-4 py-3 text-left data-[state=active]:border-zinc-200 data-[state=active]:bg-white data-[state=active]:text-zinc-950 dark:data-[state=active]:border-white/10 dark:data-[state=active]:bg-[#09090B] dark:data-[state=active]:text-white",
                "focus-visible:ring-zinc-900 dark:focus-visible:ring-white",
              )}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="font-medium">{section.label}</span>
                {section.badge ? (
                  <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                    {section.badge}
                  </span>
                ) : null}
              </span>
              <span className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {section.description}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </div>
  );
}
