export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function fmtUSD(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return `$${v.toFixed(4)}`;
}

export function isValidTrc20(addr: string) {
  return /^T[A-Za-z0-9]{33}$/.test(addr.trim());
}
