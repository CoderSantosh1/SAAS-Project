// The first link whose page slug is one of `slugs`, keeping the order links appear in.
// Headers use it to point their call-to-action button at the right page.
export function findCtaLink<T extends { href: string }>(links: T[], slugs: string[]) {
  return links.find((link) => slugs.some((slug) => link.href.endsWith(`/${slug}`)));
}
