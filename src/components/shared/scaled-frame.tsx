"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Shows a page at a fixed device width, scaled down to fit its box. The sandbox has
// no allow-scripts, so a framed site renders as static HTML and cannot run code.
export function ScaledFrame({
  src,
  title,
  deviceWidth,
  interactive = false,
  className,
}: {
  src: string;
  title: string;
  deviceWidth: number;
  interactive?: boolean;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const element = boxRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = box.width ? box.width / deviceWidth : 1;

  return (
    <div
      ref={boxRef}
      className={cn("relative overflow-hidden bg-primary-light", !loaded && "animate-pulse", className)}
    >
      {box.width > 0 && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          sandbox="allow-same-origin"
          scrolling={interactive ? undefined : "no"}
          tabIndex={interactive ? undefined : -1}
          aria-hidden={interactive ? undefined : true}
          onLoad={() => setLoaded(true)}
          className={cn(
            "absolute top-0 left-0 origin-top-left border-0 transition-opacity",
            !loaded && "opacity-0",
            !interactive && "pointer-events-none",
          )}
          style={{
            width: deviceWidth,
            height: box.height / scale,
            transform: `scale(${scale})`,
          }}
        />
      )}
    </div>
  );
}
