"use client";

import { useState, useEffect } from "react";
import {
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { useLoading } from "@/components/layout/LoadingContext";

interface DailySalesData {
  date: string;
  revenue: number;
  transactions: number;
  items: number;
  averageOrderValue: number;
  topCategories: Array<{
    name: string;
    revenue: number;
    quantity: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
}

export default function DailySalesPage() {
  const [data, setData] = useState<DailySalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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
      setData(result.dailySales || []);
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

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
    });
  };

  const getTotalRevenue = () => {
    return data.reduce((sum, day) => sum + day.revenue, 0);
  };

  const getTotalTransactions = () => {
    return data.reduce((sum, day) => sum + day.transactions, 0);
  };

  const getTotalItems = () => {
    return data.reduce((sum, day) => sum + day.items, 0);
  };

  const getAverageDailyRevenue = () => {
    return data.length > 0 ? getTotalRevenue() / data.length : 0;
  };

  const getBestDay = () => {
    return data.reduce(
      (best, day) => (day.revenue > best.revenue ? day : best),
      data[0] || { revenue: 0, date: "" }
    );
  };

  const getWorstDay = () => {
    return data.reduce(
      (worst, day) => (day.revenue < worst.revenue ? day : worst),
      data[0] || { revenue: 0, date: "" }
    );
  };

  const selectedDayData = selectedDate
    ? data.find((day) => day.date === selectedDate)
    : null;

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Daily Sales Report
          </h1>
          <p className="text-gray-600 mt-2">
            {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
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
                {formatCurrency(getTotalRevenue())}
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
                {getTotalTransactions().toLocaleString()}
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
                Average Daily Revenue
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(getAverageDailyRevenue())}
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
              <p className="text-sm font-medium text-gray-600">
                Total Items Sold
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {getTotalItems().toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Best and Worst Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Day</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {formatDate(getBestDay().date)}
              </p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(getBestDay().revenue)}
              </p>
              <p className="text-sm text-gray-500">
                {getBestDay().transactions} transactions
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Worst Day
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {formatDate(getWorstDay().date)}
              </p>
              <p className="text-2xl font-semibold text-red-600">
                {formatCurrency(getWorstDay().revenue)}
              </p>
              <p className="text-sm text-gray-500">
                {getWorstDay().transactions} transactions
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Sales Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Sales Trend
        </h3>
        <div className="h-64 flex items-end justify-between space-x-1">
          {data.map((day, index) => {
            const maxRevenue = Math.max(...data.map((d) => d.revenue));
            const height =
              maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
            const isSelected = selectedDate === day.date;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <button
                  onClick={() =>
                    setSelectedDate(selectedDate === day.date ? null : day.date)
                  }
                  className={`w-full rounded-t transition-all duration-200 ${
                    isSelected
                      ? "bg-indigo-500"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  style={{ height: `${height}%`, minHeight: "4px" }}
                  title={`${formatDate(day.date)}: ${formatCurrency(
                    day.revenue
                  )}`}
                ></button>
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {formatDateShort(day.date)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDayData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Details for {formatDate(selectedDayData.date)}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(selectedDayData.revenue)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {selectedDayData.transactions}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Average Order Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(selectedDayData.averageOrderValue)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Top Categories
                </h4>
                <div className="space-y-2">
                  {selectedDayData.topCategories
                    .slice(0, 5)
                    .map((category, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-900">
                          {category.name}
                        </span>
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

              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Payment Methods
                </h4>
                <div className="space-y-2">
                  {selectedDayData.paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-900 capitalize">
                        {method.method}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(method.revenue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {method.count} transactions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Daily Sales Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Order Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((day, index) => (
                <tr
                  key={index}
                  className={selectedDate === day.date ? "bg-indigo-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(day.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(day.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.transactions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(day.averageOrderValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() =>
                        setSelectedDate(
                          selectedDate === day.date ? null : day.date
                        )
                      }
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {selectedDate === day.date
                        ? "Hide Details"
                        : "View Details"}
                    </button>
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
