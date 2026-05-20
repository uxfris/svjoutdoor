/** Default landing route after login (level 1 = admin, 2 = cashier). */
export function getPostLoginPath(level: number | null | undefined): string {
  return level === 2 ? "/pos" : "/dashboard";
}
