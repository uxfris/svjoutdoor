"use client";

import { useState, useEffect } from "react";
import {
  TrophyIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  CalendarIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { useLoading } from "@/components/layout/LoadingContext";

interface TopSellingItem {
  name: string;
  revenue: number;
  quantity: number;
  transactions: number;
  averagePrice: number;
  growth: number;
  rank: number;
  category: string;
}

interface TopSellingData {
  period: {
    start: string;
    end: string;
  };
  topItems: TopSellingItem[];
  totalRevenue: number;
  totalQuantity: number;
  totalTransactions: number;
  bestPerformer: TopSellingItem | null;
  fastestGrowing: TopSellingItem | null;
  categories: Array<{
    name: string;
    revenue: number;
    quantity: number;
    items: number;
  }>;
}

export default function TopSellingPage() {
  const [data, setData] = useState<TopSellingData | null>(null);
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
  const [limit, setLimit] = useState(20);
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
      const topItems =
        result.topCategories?.map((category: any, index: number) => ({
          name: category.name,
          revenue: category.revenue,
          quantity: category.quantity,
          transactions: category.transactions,
          averagePrice:
            category.quantity > 0 ? category.revenue / category.quantity : 0,
          growth: Math.random() * 50 - 25, // Mock growth data
          rank: index + 1,
          category: category.name,
        })) || [];

      const bestPerformer = topItems[0] || null;
      const fastestGrowing =
        [...topItems].sort((a, b) => b.growth - a.growth)[0] || null;

      // Group by categories
      const categories = topItems.reduce((acc: any, item: any) => {
        const existing = acc.find((c: any) => c.name === item.category);
        if (existing) {
          existing.revenue += item.revenue;
          existing.quantity += item.quantity;
          existing.items += 1;
        } else {
          acc.push({
            name: item.category,
            revenue: item.revenue,
            quantity: item.quantity,
            items: 1,
          });
        }
        return acc;
      }, []);

      setData({
        period: result.period,
        topItems,
        totalRevenue: result.overview?.totalRevenue || 0,
        totalQuantity: result.overview?.totalItems || 0,
        totalTransactions: result.overview?.totalTransactions || 0,
        bestPerformer,
        fastestGrowing,
        categories,
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
    return [...data.topItems]
      .sort((a, b) => {
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
      })
      .slice(0, limit);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <TrophyIcon className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <TrophyIcon className="w-5 h-5 text-orange-500" />;
    return (
      <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
        {rank}
      </span>
    );
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
            Top Selling Items
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
                Total Items Sold
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.totalQuantity.toLocaleString()}
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
                Total Transactions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.totalTransactions.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrophyIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.topItems.length}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <StarIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Best Performer and Fastest Growing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Best Performer
          </h3>
          {data.bestPerformer ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrophyIcon className="w-8 h-8 text-yellow-500 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {data.bestPerformer.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {data.bestPerformer.quantity} items sold
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(data.bestPerformer.revenue)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(data.bestPerformer.averagePrice)} avg
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fastest Growing
          </h3>
          {data.fastestGrowing ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="w-8 h-8 text-green-500 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {data.fastestGrowing.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {data.fastestGrowing.quantity} items sold
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">
                  {formatPercentage(data.fastestGrowing.growth)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(data.fastestGrowing.revenue)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>

      {/* Top Items Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top 10 Items by Revenue
        </h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {data.topItems.slice(0, 10).map((item, index) => {
            const maxRevenue = Math.max(...data.topItems.map((i) => i.revenue));
            const height =
              maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="bg-gradient-to-t from-blue-500 to-blue-400 w-full rounded-t"
                  style={{ height: `${height}%`, minHeight: "4px" }}
                ></div>
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {item.name.length > 8
                    ? item.name.substring(0, 8) + "..."
                    : item.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Selling Items
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
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="50">Top 50</option>
                <option value="100">Top 100</option>
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
                  Item
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
                  Avg Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedData().map((item, index) => (
                <tr
                  key={index}
                  className={item.rank <= 3 ? "bg-yellow-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      {getRankIcon(item.rank)}
                      <span className="ml-2">#{item.rank}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.transactions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.averagePrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      {item.growth >= 0 ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span
                        className={`${
                          item.growth >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatPercentage(item.growth)}
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
