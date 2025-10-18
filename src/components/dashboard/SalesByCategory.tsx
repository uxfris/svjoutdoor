"use client";

import { useState, useEffect, useMemo } from "react";
import { useDataCache } from "@/hooks/useDataCache";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

interface CategorySalesData {
  id_kategori: number;
  nama_kategori: string;
  total_sales: number; // Count of unique sales (not line items)
  total_quantity: number; // Total quantity sold
  total_revenue: number; // Total revenue from subtotals
}

interface SalesByCategoryProps {
  timeFilter: string;
  onTimeFilterChange: (filter: string) => void;
  isAdmin: boolean;
}

export function SalesByCategory({
  timeFilter,
  onTimeFilterChange,
  isAdmin,
}: SalesByCategoryProps) {
  const [loading, setLoading] = useState(true);

  const { fetchData: fetchSalesByCategory } = useDataCache(
    `sales-by-category-${timeFilter}`,
    async () => {
      try {
        const response = await fetch(
          `/api/dashboard/sales-by-category?time=${timeFilter}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch sales by category");
        }
        const data = await response.json();
        return data.data || [];
      } catch (error) {
        console.error("Error fetching sales by category:", error);
        return [];
      }
    },
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  const [categoryData, setCategoryData] = useState<CategorySalesData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchSalesByCategory();
        setCategoryData(data);
      } catch (error) {
        console.error("Error loading category data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeFilter, fetchSalesByCategory]);

  const totalRevenue = useMemo(() => {
    return categoryData.reduce(
      (sum, category) => sum + category.total_revenue,
      0
    );
  }, [categoryData]);

  const totalSales = useMemo(() => {
    return categoryData.reduce(
      (sum, category) => sum + category.total_sales,
      0
    );
  }, [categoryData]);

  const totalQuantity = useMemo(() => {
    return categoryData.reduce(
      (sum, category) => sum + category.total_quantity,
      0
    );
  }, [categoryData]);

  const timeFilterOptions = [
    { value: "today", label: "Hari Ini" },
    { value: "yesterday", label: "Kemarin" },
    { value: "week", label: "Minggu Ini" },
    { value: "month", label: "Bulan Ini" },
    { value: "year", label: "Tahun Ini" },
    { value: "all", label: "Semua Waktu" },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Penjualan per Kategori
          </h3>
          <p className="text-sm text-gray-600">
            {isAdmin
              ? "Rincian pendapatan per kategori produk"
              : "Performa penjualan Anda per kategori"}
          </p>
        </div>
        <div className="relative">
          <select
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value)}
            className="appearance-none bg-white px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors cursor-pointer min-w-[140px]"
          >
            {timeFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Pendapatan
              </p>
              <p className="text-2xl font-bold text-blue-900">
                Rp {totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">
                Total Penjualan
              </p>
              <p className="text-2xl font-bold text-green-900">{totalSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <ShoppingBagIcon className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-600">
                Total Kuantitas
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {totalQuantity}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {categoryData.length > 0 ? (
          categoryData.map((category, index) => {
            const percentage =
              totalRevenue > 0
                ? (category.total_revenue / totalRevenue) * 100
                : 0;

            return (
              <div
                key={category.id_kategori}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {category.nama_kategori}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {category.total_sales} penjualan •{" "}
                        {category.total_quantity} item
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      Rp {category.total_revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {percentage.toFixed(1)}% dari total
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada data penjualan tersedia
            </h3>
            <p className="text-gray-600">
              Tidak ada penjualan ditemukan untuk periode waktu yang dipilih
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
