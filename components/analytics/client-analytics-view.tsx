"use client";

import dynamic from "next/dynamic";
import { AnalyticsViewSkeleton } from "@/components/dashboard/analytics-view-skeleton";

const AnalyticsViews = dynamic(() => import("./analytics-view"), {
  ssr: false,
  loading: () => <AnalyticsViewSkeleton />,
});

export default function ClientAnalyticsView() {
  return <AnalyticsViews />;
}
