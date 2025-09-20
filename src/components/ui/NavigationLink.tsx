"use client";

import Link from "next/link";
import { useLoading } from "@/components/layout/LoadingContext";
import { ReactNode } from "react";

interface NavigationLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function NavigationLink({
  href,
  children,
  className,
  onClick,
}: NavigationLinkProps) {
  const { startNavigation } = useLoading();

  const handleClick = () => {
    if (onClick) onClick();
    startNavigation();
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
