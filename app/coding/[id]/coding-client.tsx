"use client";

import dynamic from "next/dynamic";

// The runner reads your saved draft from localStorage and starts a timer,
// so it only renders in the browser.
export const CodingRunner = dynamic(() => import("@/components/coding-runner").then((m) => m.CodingRunner), {
  ssr: false,
  loading: () => <span className="loading loading-spinner" />,
});
