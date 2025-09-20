"use client";

import { useState, useEffect } from "react";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useLoading } from "@/components/layout/LoadingContext";

interface CategorySalesData {
  name: string;
  revenue: number;
  quantity: number;
  transactions: number;
  percentage: number;
  averageOrderValue: number;
  growth: number;
}

interface SalesByCategoryData {
  period: {
    start: string;
    end: string;
  };
  categorySales: CategorySalesData[];
  totalRevenue: number;
  totalTransactions: number;
  totalQuantity: number;
  topPerforming: CategorySalesData[];
  underPerforming: CategorySalesData[];
}

export default function SalesByCategoryPage() {
  const [data, setData] = useState<SalesByCategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [sortBy, setSortBy] = useState<"revenue" | "quantity" | "transactions">(
    "revenue"
  );
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setGlobalLoading(true);
      const response = await fetch(
        `/api/reports/sales-summary?startDate=${dateRange.start}&endDate=${dateRange.end}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();

      // Transform the data for this specific report
      const categorySales =
        result.categorySales?.map((category: any) => ({
          name: category.name,
          revenue: category.revenue,
          quantity: category.quantity,
          transactions: category.transactions,
          percentage: category.percentage,
          averageOrderValue:
            category.transactions > 0
              ? category.revenue / category.transactions
              : 0,
          growth: Math.random() * 40 - 20, // Mock growth data
        })) || [];

      const sortedCategories = [...categorySales].sort(
        (a, b) => b.revenue - a.revenue
      );
      const topPerforming = sortedCategories.slice(0, 5);
      const underPerforming = sortedCategories.slice(-5).reverse();

      setData({
        period: result.period,
        categorySales: sortedCategories,
        totalRevenue: result.overview?.totalRevenue || 0,
        totalTransactions: result.overview?.totalTransactions || 0,
        totalQuantity: result.overview?.totalItems || 0,
        topPerforming,
        underPerforming,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const getSortedData = () => {
    if (!data) return [];
    return [...data.categorySales].sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return b.revenue - a.revenue;
        case "quantity":
          return b.quantity - a.quantity;
        case "transactions":
          return b.transactions - a.transactions;
        default:
          return b.revenue - a.revenue;
      }
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sales by Category
          </h1>
          <p className="text-gray-600 mt-2">
            {formatDate(data.period.start)} - {formatDate(data.period.end)}
          </p>
        </div>
        <div className="flex space-x-3">
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Transactions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.totalTransactions.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Items Sold
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.totalQuantity.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.categorySales.length}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top and Under Performing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing Categories
          </h3>
          <div className="space-y-4">
            {data.topPerforming.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-semibold text-green-600">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {category.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(category.revenue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {category.quantity} items ({category.percentage.toFixed(1)}
                    %)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Under Performing Categories
          </h3>
          <div className="space-y-4">
            {data.underPerforming.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-semibold text-red-600">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {category.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(category.revenue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {category.quantity} items ({category.percentage.toFixed(1)}
                    %)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Sales Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue by Category
        </h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {data.categorySales.slice(0, 10).map((category, index) => {
            const maxRevenue = Math.max(
              ...data.categorySales.map((c) => c.revenue)
            );
            const height =
              maxRevenue > 0 ? (category.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="bg-blue-500 w-full rounded-t"
                  style={{ height: `${height}%`, minHeight: "4px" }}
                ></div>
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {category.name.length > 8
                    ? category.name.substring(0, 8) + "..."
                    : category.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Category Sales Details
            </h3>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="revenue">Sort by Revenue</option>
                <option value="quantity">Sort by Quantity</option>
                <option value="transactions">Sort by Transactions</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Order Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Share
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedData().map((category, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(category.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.transactions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(category.averageOrderValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.percentage.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      {category.growth >= 0 ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span
                        className={`${
                          category.growth >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatPercentage(category.growth)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
