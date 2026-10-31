"use client";

import { Monitor, Smartphone, Tablet, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { ScaledFrame } from "@/components/shared/scaled-frame";
import { cn } from "@/lib/utils";

type Device = { id: string; label: string; icon: LucideIcon; width: number; boxClass: string };

const DEVICES: Device[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: 1280, boxClass: "aspect-[16/10] w-full" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 768, boxClass: "aspect-[3/4] w-full max-w-xl" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: 375, boxClass: "aspect-[9/17] w-full max-w-[375px]" },
];

export function ThemePreview({ src, title }: { src: string; title: string }) {
  const [deviceId, setDeviceId] = useState("desktop");
  const device = DEVICES.find((candidate) => candidate.id === deviceId) ?? DEVICES[0]!;

  return (
    <div>
      <div role="group" aria-label="Preview size" className="mb-4 flex justify-center gap-1">
        {DEVICES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === deviceId}
            onClick={() => setDeviceId(id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              id === deviceId ? "bg-primary-light text-primary-hover" : "text-secondary-text hover:bg-surface",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <ScaledFrame
          key={device.id}
          src={src}
          title={`${title}, ${device.label.toLowerCase()} preview`}
          deviceWidth={device.width}
          interactive
          className={cn("rounded-lg border border-border shadow-card", device.boxClass)}
        />
      </div>
    </div>
  );
}
