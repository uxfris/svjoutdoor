export type DiscountType = "percentage" | "amount";

export interface SaleDiscountFields {
  total_harga: number;
  diskon?: number;
  discount_type?: DiscountType;
  bayar?: number;
}

export interface ItemDiscountFields {
  harga_jual: number;
  diskon?: number;
  discount_type?: DiscountType;
  jumlah?: number;
}

/** Discount value in rupiah for a given base amount. */
export function getDiscountAmount(
  baseAmount: number,
  diskon: number = 0,
  discountType: DiscountType = "amount"
): number {
  if (diskon <= 0 || baseAmount <= 0) return 0;
  if (discountType === "percentage") {
    return Math.round((baseAmount * diskon) / 100);
  }
  return diskon;
}

/** Sale-level discount in rupiah. */
export function getSaleDiscountAmount(sale: SaleDiscountFields): number {
  return getDiscountAmount(
    sale.total_harga,
    sale.diskon ?? 0,
    sale.discount_type ?? "amount"
  );
}

/** Net amount collected (after discount). Prefers bayar when stored. */
export function getNetSaleAmount(sale: SaleDiscountFields): number {
  if (sale.bayar != null && sale.bayar >= 0) {
    return sale.bayar;
  }
  return Math.max(0, sale.total_harga - getSaleDiscountAmount(sale));
}

/** Line-item discount in rupiah (unit discount × quantity). */
export function getItemDiscountAmount(item: ItemDiscountFields): number {
  const qty = item.jumlah ?? 1;
  const unitDiscount = getDiscountAmount(
    item.harga_jual,
    item.diskon ?? 0,
    item.discount_type ?? "amount"
  );
  return unitDiscount * qty;
}

/** Clamp discount input so the final price cannot go negative. */
export function clampDiscountValue(
  price: number,
  discount: number,
  discountType: DiscountType
): number {
  if (discount <= 0 || price <= 0 || isNaN(discount)) return 0;
  if (discountType === "percentage") {
    return Math.min(discount, 100);
  }
  return Math.min(discount, price);
}
