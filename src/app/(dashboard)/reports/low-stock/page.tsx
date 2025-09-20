"use client";

import { useState, useEffect } from "react";
import {
  ExclamationTriangleIcon,
  TruckIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  EyeIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useLoading } from "@/components/layout/LoadingContext";
import Link from "next/link";

interface LowStockItem {
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

interface LowStockData {
  overview: {
    totalCategories: number;
    totalStockValue: number;
    criticalStock: number;
    lowStock: number;
    highStock: number;
    goodStock: number;
  };
  criticalItems: LowStockItem[];
  lowStockItems: LowStockItem[];
  slowMovingItems: LowStockItem[];
  fastMovingItems: LowStockItem[];
}

export default function LowStockPage() {
  const [data, setData] = useState<LowStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("critical");
  const [threshold, setThreshold] = useState(20);
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
        return <TruckIcon className="w-4 h-4" />;
    }
  };

  const getCurrentData = () => {
    if (!data) return [];
    switch (activeTab) {
      case "critical":
        return data.criticalItems;
      case "low":
        return data.lowStockItems;
      case "slow":
        return data.slowMovingItems;
      case "fast":
        return data.fastMovingItems;
      default:
        return data.criticalItems;
    }
  };

  const getUrgencyLevel = (item: LowStockItem) => {
    if (item.currentStock === 0) return "critical";
    if (item.currentStock <= 5) return "high";
    if (item.currentStock <= 10) return "medium";
    return "low";
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
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
    {
      id: "critical",
      name: "Critical Stock",
      count: data.criticalItems.length,
      color: "text-red-600",
    },
    {
      id: "low",
      name: "Low Stock",
      count: data.lowStockItems.length,
      color: "text-yellow-600",
    },
    {
      id: "slow",
      name: "Slow Moving",
      count: data.slowMovingItems.length,
      color: "text-orange-600",
    },
    {
      id: "fast",
      name: "Fast Moving",
      count: data.fastMovingItems.length,
      color: "text-green-600",
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Low Stock Alert</h1>
          <p className="text-gray-600 mt-2">
            Monitor items that need immediate attention
          </p>
        </div>
        <div className="flex space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Threshold:
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
              min="1"
              max="100"
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

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Critical Stock
              </p>
              <p className="text-2xl font-semibold text-red-600">
                {data.criticalItems.length}
              </p>
              <p className="text-sm text-gray-500">Items at 0-5 units</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {data.lowStockItems.length}
              </p>
              <p className="text-sm text-gray-500">Items at 6-20 units</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Slow Moving</p>
              <p className="text-2xl font-semibold text-orange-600">
                {data.slowMovingItems.length}
              </p>
              <p className="text-sm text-gray-500">Low turnover rate</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fast Moving</p>
              <p className="text-2xl font-semibold text-green-600">
                {data.fastMovingItems.length}
              </p>
              <p className="text-sm text-gray-500">High turnover rate</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TruckIcon className="w-6 h-6 text-green-600" />
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
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${getUrgencyColor(
                      tab.id === "critical"
                        ? "critical"
                        : tab.id === "low"
                        ? "high"
                        : "medium"
                    )}`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Stock Alert Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {tabs.find((t) => t.id === activeTab)?.name} Items
            </h3>
            <Link
              href="/purchases/new"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Purchase
            </Link>
          </div>
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
                  Urgency
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
              {getCurrentData().map((item) => {
                const urgency = getUrgencyLevel(item);
                return (
                  <tr
                    key={item.id}
                    className={
                      urgency === "critical"
                        ? "bg-red-50"
                        : urgency === "high"
                        ? "bg-orange-50"
                        : ""
                    }
                  >
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
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(
                          urgency
                        )}`}
                      >
                        {getStockStatusIcon(item.stockStatus)}
                        <span className="ml-1 capitalize">{urgency}</span>
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
                        <Link
                          href={`/purchases/new?category=${item.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Create Purchase Order"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Link>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Recommendations
        </h3>
        <div className="space-y-3">
          {data.criticalItems.length > 0 && (
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {data.criticalItems.length} items are critically low on stock
                </p>
                <p className="text-sm text-red-700">
                  Consider placing urgent purchase orders to avoid stockouts
                </p>
              </div>
            </div>
          )}
          {data.slowMovingItems.length > 0 && (
            <div className="flex items-start">
              <ChartBarIcon className="w-5 h-5 text-orange-600 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  {data.slowMovingItems.length} items are moving slowly
                </p>
                <p className="text-sm text-orange-700">
                  Consider promotional activities or reducing stock levels
                </p>
              </div>
            </div>
          )}
          {data.fastMovingItems.length > 0 && (
            <div className="flex items-start">
              <TruckIcon className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {data.fastMovingItems.length} items are moving quickly
                </p>
                <p className="text-sm text-green-700">
                  Consider increasing stock levels to meet demand
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
