"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PrintService, PrintReceiptData } from "@/lib/print-service";
import {
  PrinterIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

interface SaleData {
  id_penjualan: number;
  total_item: number;
  total_harga: number;
  diskon: number;
  discount_type: "percentage" | "amount";
  bayar: number;
  diterima: number;
  payment_method: "cash" | "debit";
  created_at: string;
  member?: {
    nama: string;
    kode_member: string;
  };
  user?: {
    name: string;
  };
  items: Array<{
    nama_kategori: string;
    harga_jual: number;
    jumlah: number;
    subtotal: number;
  }>;
  setting: {
    nama_perusahaan: string;
    alamat: string;
    telepon: string;
  };
}

export default function TransactionCompletePage() {
  const [saleData, setSaleData] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleId = searchParams.get("id");
  const supabase = createClient();

  useEffect(() => {
    if (saleId) {
      loadSaleData();
    } else {
      router.push("/pos");
    }
  }, [saleId]);

  const loadSaleData = async () => {
    try {
      console.log("Loading sale data for ID:", saleId);

      if (!saleId || isNaN(parseInt(saleId))) {
        throw new Error("Invalid sale ID");
      }

      // Use the API endpoint to get sale data
      const response = await fetch(`/api/sales/${saleId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load sale data");
      }

      const saleData = await response.json();
      console.log("Sale data loaded:", saleData);

      setSaleData(saleData);
    } catch (error: any) {
      console.error("Error loading sale data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSmallReceipt = async () => {
    if (!saleData) return;
    setPrinting(true);
    try {
      await PrintService.printSmallReceipt(saleData);
    } catch (error) {
      console.error("Error printing small receipt:", error);
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintLargeReceipt = async () => {
    if (!saleData) return;
    setPrinting(true);
    try {
      await PrintService.printLargeReceipt(saleData);
    } catch (error) {
      console.error("Error printing large receipt:", error);
    } finally {
      setPrinting(false);
    }
  };

  const handleNewTransaction = async () => {
    setNavigating(true);
    try {
      // Add a small delay to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/pos");
    } catch (error) {
      console.error("Error navigating to POS:", error);
      setNavigating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Transaction
          </h1>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={handleNewTransaction}
              disabled={navigating}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {navigating ? "Loading..." : "Back to POS"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!saleData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Transaction Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The requested transaction could not be found.
          </p>
          <button
            onClick={handleNewTransaction}
            disabled={navigating}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {navigating ? "Loading..." : "Back to POS"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Transaction Complete
              </h1>
              <p className="text-gray-600">Receipt #{saleData.id_penjualan}</p>
            </div>
            <button
              onClick={handleNewTransaction}
              disabled={navigating}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {navigating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Back to POS
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">
                Transaction Successful!
              </h3>
              <p className="text-green-700">
                The sale has been processed and recorded successfully.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Transaction Details
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Transaction Info
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receipt #:</span>
                    <span className="font-medium">{saleData.id_penjualan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(saleData.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cashier:</span>
                    <span className="font-medium">
                      {saleData.user?.name || "Unknown"}
                    </span>
                  </div>
                  {saleData.member && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member:</span>
                      <span className="font-medium">
                        {saleData.member.nama} ({saleData.member.kode_member})
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Payment Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-medium">{saleData.total_item}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      Rp {saleData.total_harga.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium">{saleData.diskon}%</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Amount to Pay:</span>
                    <span>Rp {saleData.bayar.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        saleData.payment_method === "cash"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {saleData.payment_method === "cash" ? "Cash" : "Debit"}
                    </span>
                  </div>
                  {saleData.payment_method === "cash" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Received:</span>
                        <span className="font-medium">
                          Rp {saleData.diterima.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold text-green-600">
                        <span>Change:</span>
                        <span>
                          Rp{" "}
                          {(
                            saleData.diterima - saleData.bayar
                          ).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  {saleData.payment_method === "debit" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-blue-600 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm text-blue-800 font-medium">
                          Customer will pay via debit card
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Items Sold</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {saleData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.nama_kategori}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Rp {item.harga_jual.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.jumlah}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Rp {item.subtotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Actions */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Print Options
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handlePrintSmallReceipt}
                disabled={printing}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PrinterIcon className="w-5 h-5 mr-2" />
                {printing ? "Printing..." : "Print Small Receipt"}
              </button>
              <button
                onClick={handlePrintLargeReceipt}
                disabled={printing}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                {printing ? "Generating..." : "Print Large Receipt (PDF)"}
              </button>
              <button
                onClick={handleNewTransaction}
                disabled={navigating}
                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {navigating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Starting New Transaction...
                  </>
                ) : (
                  <>
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    New Transaction
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
