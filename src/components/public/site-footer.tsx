import Link from "next/link";
import { brand } from "@/config/brand";
import { PUBLIC_CONTAINER } from "./page-header";

const GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Templates", href: "/templates" },
      { label: "Categories", href: "/categories" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className={`${PUBLIC_CONTAINER} grid gap-8 py-12 sm:grid-cols-2 md:grid-cols-4`}>
        <div>
          <p className="font-heading text-xl font-bold">{brand.name}</p>
          <p className="mt-2 text-sm text-white/70">{brand.tagline}</p>
        </div>
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-white">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className={`${PUBLIC_CONTAINER} py-5 text-xs text-white/70`}>
          &copy; {new Date().getFullYear()} {brand.name}. Create. Customize. Publish.
        </p>
      </div>
    </footer>
  );
}
