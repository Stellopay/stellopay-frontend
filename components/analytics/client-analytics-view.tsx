"use client";

import dynamic from "next/dynamic";

const AnalyticsViews = dynamic(() => import("./analytics-view"), {
  ssr: false,
});

export default function ClientAnalyticsView() {
  return <AnalyticsViews />;
}
