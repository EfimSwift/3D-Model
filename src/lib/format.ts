export function formatUah(kopecks: number): string {
  const amount = kopecks / 100;
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Prices stored as whole UAH in DB for simplicity */
export function formatUahFromDb(uah: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(uah);
}
