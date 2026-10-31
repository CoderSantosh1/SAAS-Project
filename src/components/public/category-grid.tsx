import Link from "next/link";
import type { PublicCategory } from "@/features/marketplace/queries";

export function templateCountLabel(count: number) {
  if (count === 0) return "Coming soon";
  return count === 1 ? "1 template" : `${count} templates`;
}

export function CategoryGrid({
  categories,
  hrefFor,
}: {
  categories: PublicCategory[];
  hrefFor?: (category: PublicCategory) => string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            href={hrefFor?.(category) ?? `/categories/${category.slug}`}
            className="block h-full rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-primary"
          >
            <span className="block text-sm font-semibold text-foreground">{category.name}</span>
            <span className="mt-0.5 block text-xs text-secondary-text">
              {templateCountLabel(Number(category.template_count))}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
