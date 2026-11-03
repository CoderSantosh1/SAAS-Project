"use client";

import { useEffect, useRef, useState } from "react";

// Counts up to a value like "2,500+" once visible. It renders the final value first, so
// the number is right before scripts run, in previews without scripts, and with reduced
// motion. Any theme can use it.
export function CountUp({ value }: { value: string }) {
  // Only a single number counts up, so values like "1:8" or "9–5" stay as written.
  const match = value.match(/^(\D*)([\d,]+)(\D*)$/);
  const target = match ? Number(match[2]!.replaceAll(",", "")) : NaN;
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || Number.isNaN(target) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / 1800, 1);
          setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target]);

  if (!match || shown === null) return <span ref={ref}>{value}</span>;
  return (
    <span ref={ref}>
      {match[1]}
      {shown.toLocaleString("en-US")}
      {match[3]}
    </span>
  );
}
