"use client";

import { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useLoading } from "@/components/layout/LoadingContext";

interface ProfitLossData {
  period: {
    start: string;
    end: string;
  };
  income: {
    totalRevenue: number;
    totalDiscounts: number;
    netRevenue: number;
    revenueGrowth: number;
  };
  costs: {
    costOfGoodsSold: number;
    grossProfit: number;
    grossProfitMargin: number;
  };
  expenses: {
    totalExpenses: number;
    breakdown: Array<{
      category: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
  };
  profit: {
    operatingProfit: number;
    operatingProfitMargin: number;
    netProfit: number;
    netProfitMargin: number;
    profitGrowth: number;
  };
  dailyPL: Array<{
    date: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  revenueByCategory: Array<{
    categoryId: number;
    categoryName: string;
    revenue: number;
    quantity: number;
    percentage: number;
  }>;
  summary: {
    totalTransactions: number;
    averageTransactionValue: number;
    expenseRatio: number;
    profitRatio: number;
  };
}

export default function ProfitLossPage() {
  const [data, setData] = useState<ProfitLossData | null>(null);
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
        `/api/reports/profit-loss?startDate=${dateRange.start}&endDate=${dateRange.end}`
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
            Profit & Loss Report
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.income.netRevenue)}
              </p>
              <div className="flex items-center mt-1">
                {data.income.revenueGrowth >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm ${
                    data.income.revenueGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatPercentage(data.income.revenueGrowth)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gross Profit</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.costs.grossProfit)}
              </p>
              <p className="text-sm text-gray-500">
                {data.costs.grossProfitMargin.toFixed(1)}% margin
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Expenses
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.expenses.totalExpenses)}
              </p>
              <p className="text-sm text-gray-500">
                {data.summary.expenseRatio.toFixed(1)}% of revenue
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
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p
                className={`text-2xl font-semibold ${
                  data.profit.netProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(data.profit.netProfit)}
              </p>
              <div className="flex items-center mt-1">
                {data.profit.profitGrowth >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm ${
                    data.profit.profitGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatPercentage(data.profit.profitGrowth)}
                </span>
              </div>
            </div>
            <div
              className={`p-3 rounded-lg ${
                data.profit.netProfit >= 0 ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <ChartBarIcon
                className={`w-6 h-6 ${
                  data.profit.netProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Profit & Loss Statement
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Revenue Section */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Revenue
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-medium">
                    {formatCurrency(data.income.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Less: Discounts</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(data.income.totalDiscounts)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-900">
                    Net Revenue
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(data.income.netRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Cost of Goods Sold
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cost of Goods Sold</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(data.costs.costOfGoodsSold)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-900">
                    Gross Profit
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(data.costs.grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Gross Profit Margin
                  </span>
                  <span className="text-sm text-gray-500">
                    {data.costs.grossProfitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Operating Expenses
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Total Operating Expenses
                  </span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(data.expenses.totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-900">
                    Operating Profit
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(data.profit.operatingProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Operating Profit Margin
                  </span>
                  <span className="text-sm text-gray-500">
                    {data.profit.operatingProfitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Net Profit
                </span>
                <span
                  className={`text-lg font-semibold ${
                    data.profit.netProfit >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(data.profit.netProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Net Profit Margin</span>
                <span className="text-sm text-gray-500">
                  {data.profit.netProfitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Profit/Loss Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Profit/Loss Trend
          </h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {data.dailyPL.map((day, index) => {
              const maxValue = Math.max(
                ...data.dailyPL.map((d) => Math.abs(d.profit))
              );
              const height =
                maxValue > 0 ? (Math.abs(day.profit) / maxValue) * 100 : 0;
              const isPositive = day.profit >= 0;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-full rounded-t ${
                      isPositive ? "bg-green-500" : "bg-red-500"
                    }`}
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

        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Expense Breakdown
          </h3>
          <div className="space-y-4">
            {data.expenses.breakdown.map((expense, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {expense.category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {expense.count} items ({expense.percentage.toFixed(1)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Revenue by Category
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
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.revenueByCategory.map((category, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.categoryName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(category.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.percentage.toFixed(1)}%
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
