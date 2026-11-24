import SettingsPageShell from "./components/settings-page-shell";

interface SettingsPageProps {
  searchParams?: Promise<{
    section?: string | string[];
    control?: string | string[];
  }>;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSection = Array.isArray(resolvedSearchParams?.section)
    ? resolvedSearchParams?.section[0]
    : resolvedSearchParams?.section;
  const initialSearchLabel = Array.isArray(resolvedSearchParams?.control)
    ? resolvedSearchParams?.control[0]
    : resolvedSearchParams?.control;

  return (
    <SettingsPageShell
      initialSection={initialSection}
      initialSearchLabel={initialSearchLabel}
    />
  );
}
