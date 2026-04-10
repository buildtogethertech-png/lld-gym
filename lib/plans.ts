

/** Returns expiry Date given a plan's month count. */
export function getPlanExpiry(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}
