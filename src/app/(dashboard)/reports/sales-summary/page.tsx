"use client";

import { useState, useEffect } from "react";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { useLoading } from "@/components/layout/LoadingContext";

interface SalesSummary {
  period: {
    start: string;
    end: string;
  };
  overview: {
    totalRevenue: number;
    totalTransactions: number;
    totalItems: number;
    averageOrderValue: number;
    revenueGrowth: number;
    transactionGrowth: number;
    itemGrowth: number;
  };
  dailySales: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  categorySales: Array<{
    name: string;
    revenue: number;
    quantity: number;
    transactions: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  topCategories: Array<{
    name: string;
    revenue: number;
    quantity: number;
    transactions: number;
  }>;
  recentSales: Array<{
    id: number;
    total: number;
    items: number;
    date: string;
    user: string;
    paymentMethod: string;
  }>;
}

export default function SalesSummaryPage() {
  const [data, setData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
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
      setData(result);
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
            Sales Summary Report
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.overview.totalRevenue)}
              </p>
              <div className="flex items-center mt-1">
                {data.overview.revenueGrowth >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm ${
                    data.overview.revenueGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatPercentage(data.overview.revenueGrowth)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
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
                {data.overview.totalTransactions.toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                {data.overview.transactionGrowth >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm ${
                    data.overview.transactionGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatPercentage(data.overview.transactionGrowth)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <ShoppingCartIcon className="w-6 h-6 text-green-600" />
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
                {data.overview.totalItems.toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                {data.overview.itemGrowth >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm ${
                    data.overview.itemGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatPercentage(data.overview.itemGrowth)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Average Order Value
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.overview.averageOrderValue)}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Sales Trend
          </h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {data.dailySales.map((day, index) => {
              const maxRevenue = Math.max(
                ...data.dailySales.map((d) => d.revenue)
              );
              const height = (day.revenue / maxRevenue) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-blue-500 w-full rounded-t"
                    style={{ height: `${height}%`, minHeight: "4px" }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {new Date(day.date).toLocaleDateString("id-ID", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Methods
          </h3>
          <div className="space-y-4">
            {data.paymentMethods.map((method, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {method.method}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(method.revenue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {method.count} transactions ({method.percentage.toFixed(1)}
                    %)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sales by Category
          </h3>
          <div className="space-y-4">
            {data.categorySales.slice(0, 5).map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
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
            Top Categories
          </h3>
          <div className="space-y-4">
            {data.topCategories.slice(0, 5).map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-semibold text-indigo-600">
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
                    {category.quantity} items
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{sale.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(sale.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                      {sale.paymentMethod}
                    </span>
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
