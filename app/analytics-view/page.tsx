import ClientAnalyticsView from "@/components/analytics/client-analytics-view";
import { Breadcrumb, type BreadcrumbItem } from "@/components/common/breadcrumb";
import { ScopedErrorBoundary } from "@/components/common/scoped-error-boundary";

/**
 * The route lives at `/analytics-view` but the user always arrives from the
 * dashboard sidebar, so the trail is spelled out rather than derived from the
 * URL segments (which would read "Analytics view").
 */
const BREADCRUMB_TRAIL: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics" },
];

export default function AnalyticsPage() {
  return (
    <ScopedErrorBoundary
      scope="analytics-view"
      fallbackHref="/dashboard"
      fallbackLabel="Back to dashboard"
    >
      <div className="px-4 py-4 md:px-6 w-full max-w-screen-xl mx-auto">
        <Breadcrumb items={BREADCRUMB_TRAIL} />
      </div>
      <ClientAnalyticsView />
    </ScopedErrorBoundary>
  );
}
