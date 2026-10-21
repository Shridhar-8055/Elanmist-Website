/** Public site address for links in emails. SITE_URL wins (set it once elanmist.com is live). */
export function siteUrl(request: Request) {
  return process.env.SITE_URL || new URL(request.url).origin;
}
