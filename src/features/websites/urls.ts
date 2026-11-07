// Where a published website can be visited on this platform.
export const LIVE_SITE_PREFIX = "/sites";

export function liveSitePath(slug: string, page?: string) {
  return page ? `${LIVE_SITE_PREFIX}/${slug}/${page}` : `${LIVE_SITE_PREFIX}/${slug}`;
}
