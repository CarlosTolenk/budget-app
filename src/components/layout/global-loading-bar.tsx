"use client";

import clsx from "clsx";
import Router from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function GlobalLoadingBar() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const activeRequests = useRef(0);
  const showTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef<number | null>(null);
  const navigationPending = useRef(false);
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  const startProgress = useCallback(() => {
    if (raf.current) {
      cancelAnimationFrame(raf.current);
    }
    setProgress(0);
    const step = () => {
      setProgress((prev) => {
        const increment = (1 - prev) * 0.1;
        const next = Math.min(prev + increment, 0.95);
        return next;
      });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, []);

  const begin = useCallback(() => {
    activeRequests.current += 1;
    if (activeRequests.current === 1 && !showTimeout.current) {
      showTimeout.current = setTimeout(() => {
        setVisible(true);
        startProgress();
        showTimeout.current = null;
      }, 150);
    }
  }, [startProgress]);

  const finish = useCallback(() => {
    activeRequests.current = Math.max(0, activeRequests.current - 1);
    if (activeRequests.current <= 0) {
      if (showTimeout.current) {
        clearTimeout(showTimeout.current);
        showTimeout.current = null;
      }
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      setProgress(1);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }
  }, []);

  const beginNavigation = useCallback(() => {
    navigationPending.current = true;
    begin();
  }, [begin]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      begin();
      try {
        return await originalFetch(...args);
      } finally {
        finish();
      }
    };

    return () => {
      window.fetch = originalFetch;
      if (showTimeout.current) {
        clearTimeout(showTimeout.current);
        showTimeout.current = null;
      }
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
  }, [begin, finish]);

  useEffect(() => {
    const handleStart = () => begin();
    const handleDone = () => finish();

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleDone);
    Router.events.on("routeChangeError", handleDone);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleDone);
      Router.events.off("routeChangeError", handleDone);
    };
  }, [begin, finish]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const handlePopState = () => beginNavigation();

    window.history.pushState = function pushState(...args) {
      beginNavigation();
      return originalPushState.apply(this, args);
    };
    window.history.replaceState = function replaceState(...args) {
      beginNavigation();
      return originalReplaceState.apply(this, args);
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [beginNavigation]);

  useEffect(() => {
    if (previousPath.current !== null && previousPath.current !== pathname && navigationPending.current) {
      navigationPending.current = false;
      finish();
    }
    previousPath.current = pathname;
  }, [pathname, finish]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1">
      <div
        className={clsx(
          "h-full origin-left transform bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
