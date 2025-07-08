"use client";

import dynamic from "next/dynamic";

const AnalyticsViews = dynamic(() => import("./AnalyticsView"), {
  ssr: false,
});

export default function ClientAnalyticsView() {
  return <AnalyticsViews />;
}
