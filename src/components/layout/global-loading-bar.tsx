"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

export function GlobalLoadingBar() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const activeRequests = useRef(0);
  const showTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef<number | null>(null);

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
