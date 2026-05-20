"use client";

import { Suspense, lazy, ComponentType } from "react";
import { CardBlockSkeleton } from "@/components/ui/page-skeletons";

interface LazyWrapperProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function LazyWrapper({ fallback, children }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <DefaultFallback />}>{children}</Suspense>
  );
}

function DefaultFallback() {
  return (
    <div className="p-8">
      <CardBlockSkeleton lines={4} />
    </div>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return function LazyLoadedComponent(props: T) {
    return (
      <LazyWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };
}
