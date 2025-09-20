"use client";

import { useState, useEffect } from "react";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useLoading } from "@/components/layout/LoadingContext";

interface StockAnalysis {
  id: number;
  name: string;
  code: string;
  currentStock: number;
  stockValue: number;
  sellingPrice: number;
  averagePurchasePrice: number;
  totalPurchased: number;
  totalSold: number;
  turnoverRate: number;
  stockStatus: "critical" | "low" | "good" | "high";
  lastPurchaseDate: string | null;
  lastSaleDate: string | null;
  lastPurchaseSupplier: string | null;
  created_at: string;
  updated_at: string;
}

interface StockLevelsData {
  overview: {
    totalCategories: number;
    totalStockValue: number;
    criticalStock: number;
    lowStock: number;
    highStock: number;
    goodStock: number;
  };
  stockAnalysis: StockAnalysis[];
  topByValue: StockAnalysis[];
  topByTurnover: StockAnalysis[];
  lowStockItems: StockAnalysis[];
  slowMovingItems: StockAnalysis[];
  fastMovingItems: StockAnalysis[];
}

export default function StockLevelsPage() {
  const [data, setData] = useState<StockLevelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setGlobalLoading(true);
      const response = await fetch("/api/reports/stock-levels");

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case "critical":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case "low":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case "high":
        return <ChartBarIcon className="w-4 h-4" />;
      default:
        return <CheckCircleIcon className="w-4 h-4" />;
    }
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

  const tabs = [
    { id: "overview", name: "Overview", count: data.overview.totalCategories },
    {
      id: "critical",
      name: "Critical Stock",
      count: data.overview.criticalStock,
    },
    { id: "low", name: "Low Stock", count: data.overview.lowStock },
    { id: "slow", name: "Slow Moving", count: data.slowMovingItems.length },
    { id: "fast", name: "Fast Moving", count: data.fastMovingItems.length },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case "critical":
        return data.stockAnalysis.filter(
          (item) => item.stockStatus === "critical"
        );
      case "low":
        return data.stockAnalysis.filter((item) => item.stockStatus === "low");
      case "slow":
        return data.slowMovingItems;
      case "fast":
        return data.fastMovingItems;
      default:
        return data.stockAnalysis;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Stock Levels Report
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor inventory levels and stock performance
          </p>
        </div>
        <div className="flex space-x-3">
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
              <p className="text-sm font-medium text-gray-600">
                Total Categories
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.overview.totalCategories}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Stock Value
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.overview.totalStockValue)}
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
                Critical Stock
              </p>
              <p className="text-2xl font-semibold text-red-600">
                {data.overview.criticalStock}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {data.overview.lowStock}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {tabs.find((t) => t.id === activeTab)?.name} Items
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turnover Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Purchase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Sale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getCurrentData().map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.currentStock.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.stockValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.turnoverRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(
                        item.stockStatus
                      )}`}
                    >
                      {getStockStatusIcon(item.stockStatus)}
                      <span className="ml-1 capitalize">
                        {item.stockStatus}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.lastPurchaseDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.lastSaleDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Stock Status Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">
                  Good Stock
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {data.overview.goodStock}
                </p>
                <p className="text-xs text-gray-500">
                  {(
                    (data.overview.goodStock / data.overview.totalCategories) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">
                  Low Stock
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {data.overview.lowStock}
                </p>
                <p className="text-xs text-gray-500">
                  {(
                    (data.overview.lowStock / data.overview.totalCategories) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">
                  Critical Stock
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {data.overview.criticalStock}
                </p>
                <p className="text-xs text-gray-500">
                  {(
                    (data.overview.criticalStock /
                      data.overview.totalCategories) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">
                  High Stock
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {data.overview.highStock}
                </p>
                <p className="text-xs text-gray-500">
                  {(
                    (data.overview.highStock / data.overview.totalCategories) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Categories by Value
          </h3>
          <div className="space-y-4">
            {data.topByValue.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-semibold text-indigo-600">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.stockValue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.currentStock} units
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
