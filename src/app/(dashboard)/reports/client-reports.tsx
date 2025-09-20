"use client";

import { useState } from "react";
import {
  DocumentArrowDownIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { PrintService } from "@/lib/print-service";

interface ReportData {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
  startDate: string;
  endDate: string;
}

interface ReportsClientProps {
  reportData: ReportData;
}

export default function ReportsClient({ reportData }: ReportsClientProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // Create a simple PDF report
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Business Report", 105, 20, { align: "center" });

      // Date range
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Period: ${new Date(
          reportData.startDate
        ).toLocaleDateString()} - ${new Date(
          reportData.endDate
        ).toLocaleDateString()}`,
        105,
        30,
        { align: "center" }
      );

      // Summary section
      let yPosition = 50;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Financial Summary", 20, yPosition);

      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      // Sales
      doc.text("Total Sales:", 20, yPosition);
      doc.text(`Rp ${reportData.totalSales.toLocaleString()}`, 120, yPosition);
      yPosition += 10;

      // Purchases
      doc.text("Total Purchases:", 20, yPosition);
      doc.text(
        `Rp ${reportData.totalPurchases.toLocaleString()}`,
        120,
        yPosition
      );
      yPosition += 10;

      // Expenses
      doc.text("Total Expenses:", 20, yPosition);
      doc.text(
        `Rp ${reportData.totalExpenses.toLocaleString()}`,
        120,
        yPosition
      );
      yPosition += 10;

      // Net Profit
      doc.setFont("helvetica", "bold");
      doc.text("Net Profit:", 20, yPosition);
      doc.text(`Rp ${reportData.netProfit.toLocaleString()}`, 120, yPosition);

      // Footer
      yPosition += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);

      doc.save(`business-report-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error exporting PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Export Reports
      </h2>
      <div className="flex space-x-4">
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
          {exporting ? "Exporting..." : "Export PDF"}
        </button>
        <button
          onClick={handlePrintReport}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PrinterIcon className="w-5 h-5 mr-2" />
          Print Report
        </button>
      </div>
    </div>
  );
}
