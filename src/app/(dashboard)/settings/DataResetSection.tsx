"use client";

import { useState } from "react";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { useRouter } from "next/navigation";

export default function DataResetSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleResetData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/reset-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setIsDialogOpen(false);

        // Show success message for 3 seconds then refresh
        setTimeout(() => {
          router.refresh();
        }, 3000);
      } else {
        alert(`Error: ${result.error || "Failed to reset data"}`);
      }
    } catch (error) {
      console.error("Error resetting data:", error);
      alert("An error occurred while resetting data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Data Reset Successful!
            </h3>
            <p className="text-gray-600 mb-4">
              All data has been successfully reset. The page will refresh
              automatically.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow border border-red-200 p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Danger Zone
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This action will permanently delete all data in the system except
              admin users. This includes all sales, purchases, members,
              suppliers, categories, and expenses. This action cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                What will be deleted:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• All sales transactions and details</li>
                <li>• All purchase transactions and details</li>
                <li>• All members and suppliers</li>
                <li>• All categories and products</li>
                <li>• All expenses</li>
                <li>• All non-admin users</li>
                <li>• All settings (will be reset to defaults)</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                What will be preserved:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Admin users (level = 1)</li>
                <li>• Database structure and tables</li>
                <li>• Default system settings</li>
              </ul>
            </div>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Reset All Data
            </button>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleResetData}
        title="Reset All Data"
        message="Are you absolutely sure you want to reset all data? This action will permanently delete all sales, purchases, members, suppliers, categories, expenses, and non-admin users. This action cannot be undone and will reset the system to its initial state."
        confirmText="Yes, Reset All Data"
        cancelText="Cancel"
        variant="danger"
        isLoading={isLoading}
      />
    </>
  );
}
