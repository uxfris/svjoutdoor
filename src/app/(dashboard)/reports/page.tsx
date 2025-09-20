import { createClient } from "@/lib/supabase/server";
import {
  CurrencyDollarIcon,
  CubeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import ReportsClient from "./client-reports";

export default async function ReportsPage() {
  const supabase = await createClient();

  // Get date range for reports (last 30 days by default)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [{ data: salesData }, { data: purchaseData }, { data: expenseData }] =
    await Promise.all([
      supabase
        .from("penjualan")
        .select("total_harga, created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),
      supabase
        .from("pembelian")
        .select("total_harga, created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),
      supabase
        .from("pengeluaran")
        .select("nominal, created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),
    ]);

  const totalSales =
    salesData?.reduce((sum, sale) => sum + sale.total_harga, 0) || 0;
  const totalPurchases =
    purchaseData?.reduce((sum, purchase) => sum + purchase.total_harga, 0) || 0;
  const totalExpenses =
    expenseData?.reduce((sum, expense) => sum + expense.nominal, 0) || 0;
  const netProfit = totalSales - totalPurchases - totalExpenses;

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center">
          <svg
            className="w-8 h-8 mr-3 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Business Reports
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Analytics and insights for your business performance
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Report Period
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                defaultValue={startDate.toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                defaultValue={endDate.toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
              />
            </div>
            <div className="flex items-end">
              <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <svg
                  className="w-5 h-5 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Sales Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
              <CurrencyDollarIcon className="w-8 h-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {totalSales.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Total Purchases Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
              <CubeIcon className="w-8 h-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Purchases
              </p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {totalPurchases.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
              <ChartBarIcon className="w-8 h-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div
              className={`rounded-xl p-4 text-white shadow-lg ${
                netProfit >= 0
                  ? "bg-gradient-to-r from-green-500 to-green-600"
                  : "bg-gradient-to-r from-red-500 to-red-600"
              }`}
            >
              {netProfit >= 0 ? (
                <ArrowTrendingUpIcon className="w-8 h-8" />
              ) : (
                <ArrowTrendingDownIcon className="w-8 h-8" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p
                className={`text-2xl font-bold ${
                  netProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                Rp {netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <ReportsClient
        reportData={{
          totalSales,
          totalPurchases,
          totalExpenses,
          netProfit,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }}
      />
    </div>
  );
}
