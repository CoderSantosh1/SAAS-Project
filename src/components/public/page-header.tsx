import type { ReactNode } from "react";

export function PageHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 text-lg text-secondary-text">{description}</p>}
    </div>
  );
}

export const PUBLIC_CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";
