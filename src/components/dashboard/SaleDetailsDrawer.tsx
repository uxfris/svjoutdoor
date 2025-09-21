"use client";

import { memo } from "react";
import { XMarkIcon as CloseIcon } from "@heroicons/react/24/outline";

interface SaleDetail {
  id_penjualan: number;
  total_item: number;
  total_harga: number;
  diskon: number;
  discount_type: "percentage" | "amount";
  bayar: number;
  diterima: number;
  payment_method: string;
  created_at: string;
  member?: { nama: string; kode_member: string } | null;
  users?: { name: string; level: number } | null;
  items: {
    id_kategori: number;
    nama_kategori: string;
    harga_jual: number;
    jumlah: number;
    diskon: number;
    discount_type: "percentage" | "amount";
    subtotal: number;
  }[];
}

interface SaleDetailsDrawerProps {
  isOpen: boolean;
  isLoading: boolean;
  selectedSale: SaleDetail | null;
  onClose: () => void;
}

export const SaleDetailsDrawer = memo(function SaleDetailsDrawer({
  isOpen,
  isLoading,
  selectedSale,
  onClose,
}: SaleDetailsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Clickable area to close drawer */}
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />

      {/* Drawer Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-[var(--framer-color-bg)] shadow-2xl transform transition-transform duration-300 ease-in-out pointer-events-auto ${
          isLoading ? "animate-pulse" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--framer-color-border)] bg-[var(--framer-color-surface)]">
            <div>
              <h2 className="text-xl font-bold text-[var(--framer-color-text)]">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <span>Memuat Detail Penjualan</span>
                    <div className="animate-pulse w-2 h-2 bg-[var(--framer-color-tint)] rounded-full"></div>
                  </div>
                ) : (
                  `Detail Penjualan #${selectedSale?.id_penjualan}`
                )}
              </h2>
              <p className="text-sm text-[var(--framer-color-text-secondary)]">
                {isLoading
                  ? "Mohon tunggu sambil kami mengambil detail..."
                  : selectedSale?.created_at
                  ? new Date(selectedSale.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--framer-color-border)] rounded-lg transition-colors"
            >
              <CloseIcon className="w-6 h-6 text-[var(--framer-color-text-secondary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--framer-color-tint)]"></div>
                <div className="text-center">
                  <p className="text-[var(--framer-color-text)] font-medium">
                    Memuat detail penjualan...
                  </p>
                  <p className="text-[var(--framer-color-text-secondary)] text-sm mt-1">
                    Mengambil informasi kategori dan transaksi
                  </p>
                </div>
              </div>
            ) : selectedSale ? (
              <div className="space-y-6">
                {/* Sale Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--framer-color-text-secondary)]">
                      Kasir
                    </label>
                    <p className="text-[var(--framer-color-text)] font-medium">
                      {selectedSale.users?.name || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--framer-color-text-secondary)]">
                      Member
                    </label>
                    <p className="text-[var(--framer-color-text)] font-medium">
                      {selectedSale.member?.nama || "Walk-in Customer"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--framer-color-text-secondary)]">
                      Metode Pembayaran
                    </label>
                    <p className="text-[var(--framer-color-text)] font-medium capitalize">
                      {selectedSale.payment_method}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--framer-color-text-secondary)]">
                      Total Item
                    </label>
                    <p className="text-[var(--framer-color-text)] font-medium">
                      {selectedSale.total_item}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="text-lg font-semibold text-[var(--framer-color-text)] mb-4">
                    Item
                  </h3>
                  <div className="space-y-3">
                    {selectedSale.items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-[var(--framer-color-surface)] rounded-lg p-4 border border-[var(--framer-color-border)]"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-[var(--framer-color-text)]">
                              {item.nama_kategori}
                            </h4>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-[var(--framer-color-text-secondary)]">
                              <span>Jml: {item.jumlah}</span>
                              <span>
                                Harga: Rp {item.harga_jual.toLocaleString()}
                              </span>
                              {item.diskon > 0 && (
                                <span className="text-red-600">
                                  Diskon: -Rp{" "}
                                  {item.discount_type === "percentage"
                                    ? (
                                        (item.harga_jual * item.diskon) /
                                        100
                                      ).toLocaleString()
                                    : item.diskon.toLocaleString()}
                                  {item.discount_type === "percentage" && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({item.diskon}%)
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[var(--framer-color-text)]">
                              Rp {item.subtotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-[var(--framer-color-surface)] rounded-lg p-4 border border-[var(--framer-color-border)]">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[var(--framer-color-text-secondary)]">
                        Subtotal:
                      </span>
                      <span className="text-[var(--framer-color-text)]">
                        Rp {selectedSale.total_harga.toLocaleString()}
                      </span>
                    </div>
                    {selectedSale.diskon > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--framer-color-text-secondary)]">
                          Diskon:
                        </span>
                        <span className="text-red-600">
                          - Rp{" "}
                          {selectedSale.discount_type === "percentage"
                            ? (
                                (selectedSale.total_harga *
                                  selectedSale.diskon) /
                                100
                              ).toLocaleString()
                            : selectedSale.diskon.toLocaleString()}
                          {selectedSale.discount_type === "percentage" && (
                            <span className="text-sm text-gray-500 ml-1">
                              ({selectedSale.diskon}%)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[var(--framer-color-text-secondary)]">
                        Jumlah Dibayar:
                      </span>
                      <span className="text-[var(--framer-color-text)]">
                        Rp {selectedSale.bayar.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--framer-color-text-secondary)]">
                        Kembalian:
                      </span>
                      <span className="text-[var(--framer-color-text)]">
                        Rp {selectedSale.diterima.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-[var(--framer-color-border)] pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-[var(--framer-color-text)]">
                          Total:
                        </span>
                        <span className="font-bold text-[var(--framer-color-text)] text-lg">
                          Rp {selectedSale.total_harga.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--framer-color-text-secondary)]">
                  Tidak ada detail penjualan ditemukan
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
