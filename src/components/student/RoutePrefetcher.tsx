"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const routesToPrefetch = ["/student/classes", "/student/consultations", "/student/assessments"];

const RoutePrefetcher = () => {
  const router = useRouter();

  useEffect(() => {
    routesToPrefetch.forEach((route) => {
      try {
        router.prefetch(route);
      } catch (error) {
        console.warn("Prefetch failed", route, error);
      }
    });
  }, [router]);

  return null;
};

export default RoutePrefetcher;
