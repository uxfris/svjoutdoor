"use client";

import { GlobalNavigationSkeleton } from "@/components/ui/page-skeletons";
import { useLoading } from "./LoadingContext";

export default function GlobalLoading() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return <GlobalNavigationSkeleton />;
}
