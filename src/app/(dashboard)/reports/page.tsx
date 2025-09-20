"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  TruckIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useLoading } from "@/components/layout/LoadingContext";

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  bgColor: string;
  stats?: {
    value: string;
    change: number;
    trend: "up" | "down" | "neutral";
  };
}

const reportCategories = [
  {
    title: "Sales Reports",
    description: "Analyze sales performance and trends",
    reports: [
      {
        id: "sales-summary",
        title: "Sales Summary",
        description:
          "Overview of total sales, transactions, and performance metrics",
        icon: ChartBarIcon,
        href: "/reports/sales-summary",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        id: "sales-by-category",
        title: "Sales by Category",
        description: "Breakdown of sales performance by product categories",
        icon: ShoppingCartIcon,
        href: "/reports/sales-by-category",
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        id: "daily-sales",
        title: "Daily Sales Report",
        description: "Daily sales trends and performance analysis",
        icon: CalendarIcon,
        href: "/reports/daily-sales",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        id: "top-selling",
        title: "Top Selling Items",
        description: "Best performing products and categories",
        icon: ArrowTrendingUpIcon,
        href: "/reports/top-selling",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
    ],
  },
  {
    title: "Financial Reports",
    description: "Track revenue, expenses, and profitability",
    reports: [
      {
        id: "profit-loss",
        title: "Profit & Loss",
        description: "Comprehensive P&L statement with revenue and expenses",
        icon: CurrencyDollarIcon,
        href: "/reports/profit-loss",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
      {
        id: "expense-analysis",
        title: "Expense Analysis",
        description: "Detailed breakdown of business expenses and costs",
        icon: DocumentTextIcon,
        href: "/reports/expense-analysis",
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
      {
        id: "cash-flow",
        title: "Cash Flow",
        description: "Track money in and out of the business",
        icon: ArrowTrendingUpIcon,
        href: "/reports/cash-flow",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
    ],
  },
  {
    title: "Inventory Reports",
    description: "Monitor stock levels and inventory management",
    reports: [
      {
        id: "stock-levels",
        title: "Stock Levels",
        description: "Current inventory levels and stock status",
        icon: TruckIcon,
        href: "/reports/stock-levels",
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
      },
      {
        id: "low-stock",
        title: "Low Stock Alert",
        description: "Items that need restocking or attention",
        icon: ExclamationTriangleIcon,
        href: "/reports/low-stock",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      },
      {
        id: "purchase-analysis",
        title: "Purchase Analysis",
        description: "Analysis of purchasing patterns and supplier performance",
        icon: TruckIcon,
        href: "/reports/purchase-analysis",
        color: "text-teal-600",
        bgColor: "bg-teal-50",
      },
    ],
  },
  {
    title: "Customer Reports",
    description: "Customer insights and member analytics",
    reports: [
      {
        id: "customer-analysis",
        title: "Customer Analysis",
        description: "Customer behavior, preferences, and demographics",
        icon: ChartBarIcon,
        href: "/reports/customer-analysis",
        color: "text-pink-600",
        bgColor: "bg-pink-50",
      },
      {
        id: "member-performance",
        title: "Member Performance",
        description: "Member activity and contribution to sales",
        icon: ArrowTrendingUpIcon,
        href: "/reports/member-performance",
        color: "text-violet-600",
        bgColor: "bg-violet-50",
      },
    ],
  },
];

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quickStats, setQuickStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    lowStockItems: 0,
    categories: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setLoading: setGlobalLoading } = useLoading();

  const handleReportClick = (href: string) => {
    setGlobalLoading(true);
    router.push(href);
  };

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    try {
      setLoading(true);
      const [salesResponse, stockResponse, categoriesResponse] =
        await Promise.all([
          fetch("/api/reports/sales-summary"),
          fetch("/api/reports/stock-levels"),
          fetch("/api/categories"),
        ]);

      const salesData = await salesResponse.json();
      const stockData = await stockResponse.json();
      const categoriesData = await categoriesResponse.json();

      setQuickStats({
        totalRevenue: salesData.overview?.totalRevenue || 0,
        totalSales: salesData.overview?.totalTransactions || 0,
        lowStockItems:
          (stockData.overview?.criticalStock || 0) +
          (stockData.overview?.lowStock || 0),
        categories: stockData.overview?.totalCategories || 0,
      });
    } catch (error) {
      console.error("Error fetching quick stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  const currentReports = reportCategories[selectedCategory]?.reports || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive business analytics and insights
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              <ClockIcon className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate All"}
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export All
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {reportCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(index)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedCategory === index
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {category.title}
              </button>
            ))}
          </nav>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {reportCategories[selectedCategory]?.description}
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentReports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${report.bgColor}`}>
                  <report.icon className={`w-6 h-6 ${report.color}`} />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleReportClick(report.href)}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="View Report"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Export Report"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {report.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{report.description}</p>

              {/* Stats can be added here when needed */}

              <button
                onClick={() => handleReportClick(report.href)}
                className="w-full mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                View Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Quick Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(quickStats.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <ShoppingCartIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {quickStats.totalSales.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Low Stock Items
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {quickStats.lowStockItems}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {quickStats.categories}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
