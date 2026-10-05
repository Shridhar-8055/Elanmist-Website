// Text wordmark until the client supplies a vector logo.
// Pass a `font-*` class to override the default serif italic styling.
export function Wordmark({ className = "" }: { className?: string }) {
  const custom = /(^|\s)font-(?!light|normal|medium|semibold|bold)/.test(className);
  const base = custom ? "" : "font-serif italic tracking-tight";
  return <span className={`${base} ${className}`}>Elanmist</span>;
}
