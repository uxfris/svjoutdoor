import { createClient } from "@/lib/supabase/server";
import {
  MoneyIcon,
  PackageIcon,
  ExpenseIcon,
  ProfitIcon,
  LossIcon,
} from "@/components/ui/Icons";
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Business analytics and reports</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Date Range
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                defaultValue={startDate.toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                defaultValue={endDate.toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
            <div className="flex items-end">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-lg p-3 text-white">
                <MoneyIcon className="w-8 h-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-semibold text-gray-900">
                  Rp {totalSales.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-lg p-3 text-white">
                <PackageIcon className="w-8 h-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Purchases
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  Rp {totalPurchases.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-red-500 rounded-lg p-3 text-white">
                <ExpenseIcon className="w-8 h-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Expenses
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  Rp {totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center">
              <div
                className={`rounded-lg p-3 text-white ${
                  netProfit >= 0 ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {netProfit >= 0 ? (
                  <ProfitIcon className="w-8 h-8" />
                ) : (
                  <LossIcon className="w-8 h-8" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p
                  className={`text-2xl font-semibold ${
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
      </div>);
}
