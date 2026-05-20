"use client";

import { useState, useEffect, useMemo } from "react";
import { useDataCache } from "@/hooks/useDataCache";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { CardBlockSkeleton } from "@/components/ui/page-skeletons";

interface CategorySalesData {
  id_kategori: number;
  nama_kategori: string;
  total_sales: number;
  total_quantity: number;
  total_revenue: number;
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
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const cacheKey =
    timeFilter === "custom"
      ? `sales-by-category-${timeFilter}-${startDate}-${endDate}`
      : `sales-by-category-${timeFilter}`;

  const { fetchData: fetchSalesByCategory } = useDataCache(
    cacheKey,
    async () => {
      try {
        const params =
          timeFilter === "custom"
            ? `time=${timeFilter}&start=${startDate}&end=${endDate}`
            : `time=${timeFilter}`;
        const response = await fetch(
          `/api/dashboard/sales-by-category?${params}`
        );
        if (!response.ok) throw new Error("Failed to fetch sales by category");
        const data = await response.json();
        return {
          categoryData: data.data || [],
          totalUniqueSales: data.totalUniqueSales || 0,
        };
      } catch (error) {
        console.error("Error fetching sales by category:", error);
        return { categoryData: [], totalUniqueSales: 0 };
      }
    },
    { ttl: 2 * 60 * 1000 } // cache 2 min
  );

  const [categoryData, setCategoryData] = useState<CategorySalesData[]>([]);
  const [totalUniqueSales, setTotalUniqueSales] = useState(0);

  useEffect(() => {
    if (timeFilter === "custom" && (!startDate || !endDate)) return; // wait for both dates
    const loadData = async () => {
      setLoading(true);
      try {
        console.log("timeFilter", timeFilter);
        console.log("startDate", startDate);
        console.log("endDate", endDate);

        const data = await fetchSalesByCategory();
        console.log("data.categoryData", data.categoryData);

        setCategoryData(data.categoryData);
        setTotalUniqueSales(data.totalUniqueSales);
      } catch (error) {
        console.error("Error loading category data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [timeFilter, fetchSalesByCategory, startDate, endDate]);

  const totalRevenue = useMemo(
    () => categoryData.reduce((sum, c) => sum + c.total_revenue, 0),
    [categoryData]
  );
  const totalSales = totalUniqueSales;
  const totalQuantity = useMemo(
    () => categoryData.reduce((sum, c) => sum + c.total_quantity, 0),
    [categoryData]
  );

  const timeFilterOptions = [
    { value: "today", label: "Hari Ini" },
    { value: "yesterday", label: "Kemarin" },
    { value: "week", label: "Minggu Ini" },
    { value: "month", label: "Bulan Ini" },
    { value: "year", label: "Tahun Ini" },
    { value: "all", label: "Semua Waktu" },
    { value: "custom", label: "Rentang Tanggal" },
  ];

  if (loading) {
    return <CardBlockSkeleton lines={5} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Penjualan per Kategori
          </h3>
          <p className="text-sm text-gray-600">
            {isAdmin
              ? "Rincian pendapatan per kategori produk"
              : "Performa penjualan Anda per kategori"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
          {/* Time filter dropdown */}
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

          {/* Date range picker (only if custom) */}
          {timeFilter === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent"
              />
              <span className="text-gray-500">s.d.</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          color="blue"
          icon={<CurrencyDollarIcon className="w-8 h-8 text-blue-600 mr-3" />}
          title="Total Pendapatan"
          value={`Rp ${totalRevenue.toLocaleString()}`}
        />
        <SummaryCard
          color="green"
          icon={<ChartBarIcon className="w-8 h-8 text-green-600 mr-3" />}
          title="Total Penjualan"
          value={totalSales}
        />
        <SummaryCard
          color="purple"
          icon={<ShoppingBagIcon className="w-8 h-8 text-purple-600 mr-3" />}
          title="Total Kuantitas"
          value={totalQuantity}
        />
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

function SummaryCard({
  color,
  icon,
  title,
  value,
}: {
  color: string;
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) {
  const bg = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
  }[color];
  return (
    <div className={`${bg} rounded-lg p-4`}>
      <div className="flex items-center">
        {icon}
        <div>
          <p className={`text-sm font-medium text-${color}-600`}>{title}</p>
          <p className={`text-2xl font-bold text-${color}-900`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
