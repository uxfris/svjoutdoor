"use client";

import { useState, useMemo } from "react";
import {
  DocumentArrowDownIcon,
  PrinterIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { MoneyIcon, PackageIcon, ProfitIcon } from "@/components/ui/Icons";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, subDays, startOfDay, endOfDay } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

interface ReportData {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
  totalTransactions: number;
  averageTransactionValue: number;
  totalProductsSold: number;
  totalMembers: number;
  salesGrowth: number;
  startDate: string;
  endDate: string;
  dailySales: Record<string, number>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    category: string;
  }>;
  paymentMethods: Record<string, number>;
  categorySales: Record<string, number>;
  salesData: any[];
  purchaseData: any[];
  expenseData: any[];
  productsData: any[];
  membersData: any[];
  categoriesData: any[];
}

interface EnhancedReportsClientProps {
  reportData: ReportData;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
];

export default function EnhancedReportsClient({
  reportData,
}: EnhancedReportsClientProps) {
  const [exporting, setExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [showCharts, setShowCharts] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate chart data
  const chartData = useMemo(() => {
    const days = parseInt(selectedPeriod);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const sales = reportData.dailySales[dateStr] || 0;

      data.push({
        date: format(date, "MMM dd"),
        sales,
        day: format(date, "EEEE"),
      });
    }

    return data;
  }, [selectedPeriod, reportData.dailySales]);

  const pieData = useMemo(() => {
    return Object.entries(reportData.paymentMethods).map(
      ([method, value], index) => ({
        name: method.charAt(0).toUpperCase() + method.slice(1),
        value,
        color: COLORS[index % COLORS.length],
      })
    );
  }, [reportData.paymentMethods]);

  const categoryData = useMemo(() => {
    return Object.entries(reportData.categorySales).map(
      ([category, sales], index) => ({
        name: category,
        sales,
        color: COLORS[index % COLORS.length],
      })
    );
  }, [reportData.categorySales]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const element = document.getElementById("report-content");
      if (!element) {
        alert("Report content not found. Please try again.");
        return;
      }

      // Try the enhanced method first
      try {
        await exportPDFWithCanvas(element);
      } catch (canvasError) {
        console.warn(
          "Canvas method failed, trying fallback method:",
          canvasError
        );
        await exportPDFFallback();
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error exporting PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const exportPDFWithCanvas = async (element: HTMLElement) => {
    // Create a temporary element with simplified styles for PDF export
    const tempElement = element.cloneNode(true) as HTMLElement;

    // Remove problematic CSS classes and replace with PDF-safe styles
    const gradientElements = tempElement.querySelectorAll(
      '[class*="gradient-to-r"]'
    );
    gradientElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.className = htmlEl.className.replace(
        /bg-gradient-to-r from-\w+-\d+ to-\w+-\d+/g,
        "bg-gray-100"
      );
      htmlEl.style.background = "#f3f4f6";
      htmlEl.style.color = "#000000";
    });

    // Remove any remaining gradient classes and fix text colors
    const allElements = tempElement.querySelectorAll("*");
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.className.includes("gradient-to-r")) {
        htmlEl.className = htmlEl.className.replace(
          /bg-gradient-to-r from-\w+-\d+ to-\w+-\d+/g,
          "bg-gray-100"
        );
      }
      // Ensure text is black for better PDF readability
      if (
        htmlEl.classList.contains("text-white") ||
        htmlEl.classList.contains("text-green-100") ||
        htmlEl.classList.contains("text-blue-100") ||
        htmlEl.classList.contains("text-purple-100") ||
        htmlEl.classList.contains("text-orange-100")
      ) {
        htmlEl.style.color = "#000000";
      }
    });

    // Temporarily append to body for rendering
    tempElement.style.position = "absolute";
    tempElement.style.left = "-9999px";
    tempElement.style.top = "0";
    tempElement.style.width = element.offsetWidth + "px";
    tempElement.style.backgroundColor = "#ffffff";
    document.body.appendChild(tempElement);

    const canvas = await html2canvas(tempElement, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
    });

    // Remove temporary element
    document.body.removeChild(tempElement);

    const imgData = canvas.toDataURL("image/png", 0.95);
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`business-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const exportPDFFallback = async () => {
    // Fallback method: Create a simple text-based PDF
    const pdf = new jsPDF("p", "mm", "a4");

    // Title
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("Business Report", 105, 20, { align: "center" });

    // Date range
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Period: ${format(
        parseISO(reportData.startDate),
        "MMM dd, yyyy"
      )} - ${format(parseISO(reportData.endDate), "MMM dd, yyyy")}`,
      105,
      30,
      { align: "center" }
    );

    // Summary section
    let yPosition = 50;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Financial Summary", 20, yPosition);

    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");

    // Sales
    pdf.text("Total Sales:", 20, yPosition);
    pdf.text(`Rp ${reportData.totalSales.toLocaleString()}`, 120, yPosition);
    yPosition += 10;

    // Purchases
    pdf.text("Total Purchases:", 20, yPosition);
    pdf.text(
      `Rp ${reportData.totalPurchases.toLocaleString()}`,
      120,
      yPosition
    );
    yPosition += 10;

    // Expenses
    pdf.text("Total Expenses:", 20, yPosition);
    pdf.text(`Rp ${reportData.totalExpenses.toLocaleString()}`, 120, yPosition);
    yPosition += 10;

    // Net Profit
    pdf.setFont("helvetica", "bold");
    pdf.text("Net Profit:", 20, yPosition);
    pdf.text(`Rp ${reportData.netProfit.toLocaleString()}`, 120, yPosition);
    yPosition += 15;

    // Additional metrics
    pdf.setFont("helvetica", "normal");
    pdf.text("Total Transactions:", 20, yPosition);
    pdf.text(reportData.totalTransactions.toString(), 120, yPosition);
    yPosition += 10;

    pdf.text("Average Transaction Value:", 20, yPosition);
    pdf.text(
      `Rp ${reportData.averageTransactionValue.toLocaleString()}`,
      120,
      yPosition
    );
    yPosition += 10;

    pdf.text("Sales Growth:", 20, yPosition);
    pdf.text(`${reportData.salesGrowth.toFixed(1)}%`, 120, yPosition);
    yPosition += 15;

    // Top Products
    pdf.setFont("helvetica", "bold");
    pdf.text("Top Products", 20, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    reportData.topProducts.slice(0, 10).forEach((product, index) => {
      pdf.text(`${index + 1}. ${product.name}`, 25, yPosition);
      pdf.text(`Rp ${product.sales.toLocaleString()}`, 120, yPosition);
      yPosition += 8;
    });

    // Footer
    yPosition += 20;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(
      `Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}`,
      20,
      yPosition
    );

    pdf.save(`business-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sales data
      const salesSheet = XLSX.utils.json_to_sheet(
        reportData.salesData.map((sale) => ({
          Date: format(parseISO(sale.created_at), "yyyy-MM-dd HH:mm"),
          "Total Amount": sale.total_harga,
          "Member ID": sale.id_member || "N/A",
        }))
      );
      XLSX.utils.book_append_sheet(workbook, salesSheet, "Sales");

      // Top products
      const productsSheet = XLSX.utils.json_to_sheet(
        reportData.topProducts.map((product) => ({
          "Product Name": product.name,
          Category: product.category,
          "Total Sales": product.sales,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, productsSheet, "Top Products");

      // Summary
      const summarySheet = XLSX.utils.json_to_sheet([
        { Metric: "Total Sales", Value: reportData.totalSales },
        { Metric: "Total Purchases", Value: reportData.totalPurchases },
        { Metric: "Total Expenses", Value: reportData.totalExpenses },
        { Metric: "Net Profit", Value: reportData.netProfit },
        { Metric: "Total Transactions", Value: reportData.totalTransactions },
        {
          Metric: "Average Transaction Value",
          Value: reportData.averageTransactionValue,
        },
        { Metric: "Sales Growth (%)", Value: reportData.salesGrowth },
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      XLSX.writeFile(
        workbook,
        `business-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Error exporting Excel file. Please try again.");
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh - in a real app, this would refetch data
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 1000);
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: ChartBarIcon },
    { id: "sales", name: "Sales Analysis", icon: MoneyIcon },
    { id: "products", name: "Products", icon: PackageIcon },
    { id: "customers", name: "Customers", icon: EyeIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChartBarIcon className="w-4 h-4" />
              <span>{showCharts ? "Hide" : "Show"} Charts</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUpIcon
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>{exporting ? "Exporting..." : "PDF"}</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 no-print">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div id="report-content" className="p-6">
          {/* Print Header */}
          <div className="hidden print:block mb-6 pb-4 border-b border-gray-300">
            <h2 className="text-2xl font-bold text-gray-900">
              {tabs.find((tab) => tab.id === activeTab)?.name} Report
            </h2>
            <p className="text-gray-600">
              Generated on {format(new Date(), "MMMM dd, yyyy")} | Period:{" "}
              {format(parseISO(reportData.startDate), "MMM dd, yyyy")} -{" "}
              {format(parseISO(reportData.endDate), "MMM dd, yyyy")}
            </p>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">
                        Total Sales
                      </p>
                      <p className="text-3xl font-bold">
                        Rp {reportData.totalSales.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        {reportData.salesGrowth >= 0 ? (
                          <ArrowUpIcon className="w-4 h-4 text-green-200" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 text-red-200" />
                        )}
                        <span className="text-sm text-green-100 ml-1">
                          {Math.abs(reportData.salesGrowth).toFixed(1)}% vs last
                          period
                        </span>
                      </div>
                    </div>
                    <MoneyIcon className="w-12 h-12 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">
                        Net Profit
                      </p>
                      <p className="text-3xl font-bold">
                        Rp {reportData.netProfit.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-100 mt-2">
                        {(
                          (reportData.netProfit / reportData.totalSales) *
                          100
                        ).toFixed(1)}
                        % margin
                      </p>
                    </div>
                    <ProfitIcon className="w-12 h-12 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">
                        Transactions
                      </p>
                      <p className="text-3xl font-bold">
                        {reportData.totalTransactions}
                      </p>
                      <p className="text-sm text-purple-100 mt-2">
                        Avg: Rp{" "}
                        {reportData.averageTransactionValue.toLocaleString()}
                      </p>
                    </div>
                    <ChartBarIcon className="w-12 h-12 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">
                        Products Sold
                      </p>
                      <p className="text-3xl font-bold">
                        {reportData.totalProductsSold}
                      </p>
                      <p className="text-sm text-orange-100 mt-2">
                        {reportData.totalMembers} active members
                      </p>
                    </div>
                    <PackageIcon className="w-12 h-12 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              {showCharts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Sales Trend
                    </h3>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              `Rp ${value.toLocaleString()}`,
                              "Sales",
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500">
                        <div className="text-center">
                          <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No sales data available for the selected period</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Payment Methods
                    </h3>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [
                              `Rp ${value.toLocaleString()}`,
                              "Amount",
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500">
                        <div className="text-center">
                          <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No payment data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Business Insights */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Business Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">
                      Performance Highlights
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        •{" "}
                        {reportData.salesGrowth >= 0
                          ? "Sales increased"
                          : "Sales decreased"}{" "}
                        by {Math.abs(reportData.salesGrowth).toFixed(1)}%
                        compared to last period
                      </li>
                      <li>
                        • Average transaction value: Rp{" "}
                        {reportData.averageTransactionValue.toLocaleString()}
                      </li>
                      <li>
                        • Profit margin:{" "}
                        {(
                          (reportData.netProfit / reportData.totalSales) *
                          100
                        ).toFixed(1)}
                        %
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">
                      Recommendations
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Focus on high-performing product categories</li>
                      <li>• Consider expanding popular payment methods</li>
                      <li>• Implement customer retention strategies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sales Analysis Tab */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Daily Sales Breakdown
                  </h3>
                  <div className="space-y-3">
                    {chartData.slice(-7).map((day, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {day.date}
                          </p>
                          <p className="text-sm text-gray-500">{day.day}</p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          Rp {day.sales.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Category Performance
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `Rp ${value.toLocaleString()}`,
                          "Sales",
                        ]}
                      />
                      <Bar dataKey="sales" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top Performing Products
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Sales
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.topProducts.map((product, index) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            Rp {product.sales.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Customer Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Members</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {reportData.totalMembers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">New This Period</span>
                      <span className="text-lg font-semibold text-green-600">
                        {
                          reportData.membersData.filter(
                            (member) =>
                              new Date(member.created_at) >=
                              new Date(reportData.startDate)
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Members
                  </h3>
                  <div className="space-y-3">
                    {reportData.membersData.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.nama}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.email}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(parseISO(member.created_at), "MMM dd")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Member Growth
                  </h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      +
                      {
                        reportData.membersData.filter(
                          (member) =>
                            new Date(member.created_at) >=
                            new Date(reportData.startDate)
                        ).length
                      }
                    </div>
                    <p className="text-sm text-gray-600">
                      New members this period
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
