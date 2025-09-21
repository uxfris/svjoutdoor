"use client";

import { memo, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChartBarIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { RecentSale } from "@/lib/database.types";

interface RecentSalesTableProps {
  recentSales: RecentSale[];
  filteredSales: RecentSale[];
  allUsers: { id: string; name: string; level: number }[];
  allCategories: { id_kategori: number; nama_kategori: string }[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  cashierFilter: string;
  setCashierFilter: (filter: string) => void;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  amountFilter: string;
  setAmountFilter: (filter: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onClearFilters: () => void;
  onSaleClick: (saleId: number) => void;
  onPrintReceipt: (saleId: number) => void;
  loadingSaleId: number | null;
  printingSaleId: number | null;
  isAdmin: boolean;
}

export const RecentSalesTable = memo(function RecentSalesTable({
  recentSales,
  filteredSales,
  allUsers,
  allCategories,
  searchTerm,
  setSearchTerm,
  cashierFilter,
  setCashierFilter,
  dateFilter,
  setDateFilter,
  amountFilter,
  setAmountFilter,
  categoryFilter,
  setCategoryFilter,
  showFilters,
  setShowFilters,
  onClearFilters,
  onSaleClick,
  onPrintReceipt,
  loadingSaleId,
  printingSaleId,
  isAdmin,
}: RecentSalesTableProps) {
  const hasActiveFilters = useMemo(
    () =>
      searchTerm ||
      (isAdmin && cashierFilter !== "all") ||
      dateFilter !== "all" ||
      amountFilter !== "all" ||
      categoryFilter !== "all",
    [
      searchTerm,
      cashierFilter,
      dateFilter,
      amountFilter,
      categoryFilter,
      isAdmin,
    ]
  );

  return (
    <div className="bg-[var(--framer-color-bg)] rounded-[var(--framer-radius-xl)] shadow-md border border-[var(--framer-color-border)] overflow-hidden">
      <div className="px-8 py-6 border-b border-[var(--framer-color-border)] bg-[var(--framer-color-surface)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--framer-color-text)]">
              Penjualan Terbaru
            </h2>
            <p className="text-sm text-[var(--framer-color-text-secondary)] mt-1">
              Transaksi terbaru dari toko Anda
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-[var(--framer-color-text-tertiary)]">
            <span className="w-2 h-2 bg-[var(--framer-color-success)] rounded-full animate-pulse"></span>
            <span>Update langsung</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="px-8 py-4 border-b border-[var(--framer-color-border)] bg-[var(--framer-color-bg)]">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--framer-color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Cari berdasarkan ID penjualan, kasir, atau jumlah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--framer-color-border)] rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent bg-[var(--framer-color-bg)] text-[var(--framer-color-text)]"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--framer-color-border)] rounded-lg hover:bg-[var(--framer-color-surface)] transition-colors text-[var(--framer-color-text)]"
          >
            <FunnelIcon className="h-5 w-5" />
            Filter
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 px-4 py-2 text-[var(--framer-color-text-secondary)] hover:text-[var(--framer-color-text)] transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
              Hapus
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[var(--framer-color-border)]">
            <div
              className={`grid grid-cols-1 gap-4 ${
                isAdmin ? "md:grid-cols-4" : "md:grid-cols-3"
              }`}
            >
              {/* Cashier Filter - Only show for admins */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-[var(--framer-color-text-secondary)] mb-2">
                    Kasir
                  </label>
                  <div className="relative">
                    <select
                      value={cashierFilter}
                      onChange={(e) => setCashierFilter(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-[var(--framer-color-border)] rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent bg-[var(--framer-color-bg)] text-[var(--framer-color-text)] appearance-none"
                    >
                      <option value="all">Semua Kasir</option>
                      {allUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-[var(--framer-color-text-tertiary)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-[var(--framer-color-text-secondary)] mb-2">
                  Rentang Tanggal
                </label>
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-[var(--framer-color-border)] rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent bg-[var(--framer-color-bg)] text-[var(--framer-color-text)] appearance-none"
                  >
                    <option value="all">Semua Waktu</option>
                    <option value="today">Hari Ini</option>
                    <option value="yesterday">Kemarin</option>
                    <option value="week">Minggu Ini</option>
                    <option value="month">Bulan Ini</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-[var(--framer-color-text-tertiary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Amount Filter */}
              <div>
                <label className="block text-sm font-medium text-[var(--framer-color-text-secondary)] mb-2">
                  Rentang Jumlah
                </label>
                <div className="relative">
                  <select
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-[var(--framer-color-border)] rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent bg-[var(--framer-color-bg)] text-[var(--framer-color-text)] appearance-none"
                  >
                    <option value="all">Semua Jumlah</option>
                    <option value="low">Rendah (&lt; 100k)</option>
                    <option value="medium">Sedang (100k - 500k)</option>
                    <option value="high">Tinggi (&gt; 500k)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-[var(--framer-color-text-tertiary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-[var(--framer-color-text-secondary)] mb-2">
                  Kategori
                </label>
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-[var(--framer-color-border)] rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent bg-[var(--framer-color-bg)] text-[var(--framer-color-text)] appearance-none"
                  >
                    <option value="all">Semua Kategori</option>
                    {allCategories.map((category) => (
                      <option
                        key={category.id_kategori}
                        value={category.id_kategori.toString()}
                      >
                        {category.nama_kategori}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-[var(--framer-color-text-tertiary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="px-8 py-3 bg-[var(--framer-color-surface)] border-b border-[var(--framer-color-border)]">
        <div className="text-sm text-[var(--framer-color-text-secondary)]">
          Menampilkan {filteredSales.length} dari {recentSales.length} penjualan
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--framer-color-border)]">
          <thead className="bg-[var(--framer-color-surface)]">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                ID Penjualan
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                Kasir
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                Item
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                Jumlah
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--framer-color-bg)] divide-y divide-[var(--framer-color-border)]">
            {filteredSales?.map((sale) => (
              <tr
                key={sale.id_penjualan}
                className="hover:bg-[var(--framer-color-surface)] transition-colors duration-200"
              >
                <td className="px-8 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-[var(--framer-color-tint-disabled)] rounded-[var(--framer-radius-md)] flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-[var(--framer-color-tint)]">
                        #{sale.id_penjualan}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-[var(--framer-color-tint-disabled)] rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-[var(--framer-color-tint)]">
                        {sale.users?.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[var(--framer-color-text)]">
                      {sale.users?.name ||
                        (sale.id_user
                          ? "Pengguna Tidak Ditemukan"
                          : "Tidak Ada Kasir")}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onSaleClick(sale.id_penjualan)}
                    disabled={loadingSaleId === sale.id_penjualan}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      loadingSaleId === sale.id_penjualan
                        ? "bg-[var(--framer-color-border)] text-[var(--framer-color-text-secondary)] cursor-not-allowed"
                        : "bg-[var(--framer-color-success-bg)] text-[var(--framer-color-success)] hover:bg-[var(--framer-color-success)] hover:text-white cursor-pointer"
                    }`}
                  >
                    {loadingSaleId === sale.id_penjualan ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-[var(--framer-color-text-secondary)] mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      `${sale.total_item} items`
                    )}
                  </button>
                </td>
                <td className="px-8 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-[var(--framer-color-text)]">
                    Rp {sale.total_harga.toLocaleString()}
                  </span>
                </td>
                <td className="px-8 py-4 whitespace-nowrap text-sm text-[var(--framer-color-text-tertiary)]">
                  {new Date(sale.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-8 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onPrintReceipt(sale.id_penjualan)}
                    disabled={printingSaleId === sale.id_penjualan}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      printingSaleId === sale.id_penjualan
                        ? "bg-[var(--framer-color-border)] text-[var(--framer-color-text-secondary)] cursor-not-allowed"
                        : "bg-[var(--framer-color-tint-disabled)] text-[var(--framer-color-tint)] hover:bg-[var(--framer-color-tint)] hover:text-white cursor-pointer"
                    }`}
                    title="Print Receipt"
                  >
                    {printingSaleId === sale.id_penjualan ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-[var(--framer-color-text-secondary)] mr-2"></div>
                        Printing...
                      </>
                    ) : (
                      <>
                        <PrinterIcon className="h-4 w-4 mr-2" />
                        Print
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!filteredSales || filteredSales.length === 0) && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[var(--framer-color-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-[var(--framer-color-text-tertiary)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--framer-color-text)] mb-2">
            {recentSales.length === 0 ? "No recent sales" : "No sales found"}
          </h3>
          <p className="text-[var(--framer-color-text-secondary)] mb-4">
            {recentSales.length === 0
              ? "Start making sales to see them here"
              : "Try adjusting your filters or search terms"}
          </p>
          {/* Debug information
          <div className="text-xs text-[var(--framer-color-text-tertiary)] bg-[var(--framer-color-surface)] p-3 rounded-lg max-w-md mx-auto">
            <p>Debug Info:</p>
            <p>Recent Sales: {recentSales.length}</p>
            <p>Filtered Sales: {filteredSales?.length || 0}</p>
            <p>All Users: {allUsers.length}</p>
          </div> */}
        </div>
      )}
    </div>
  );
});
