"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { currentUser, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setIsChecking(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && !isChecking && !currentUser) {
      const from =
        pathname && pathname !== "/login"
          ? `?from=${encodeURIComponent(pathname)}`
          : "";
      router.replace(`/login${from}`);
    }
  }, [loading, isChecking, currentUser, pathname, router]);

  if (loading || isChecking || !currentUser) {
    return null;
  }

  return <>{children}</>;
}
