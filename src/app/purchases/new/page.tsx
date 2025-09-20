import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { Select } from "@/components/ui/Select";

export default function NewPurchasePage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/purchases"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Purchases
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New Purchase</h1>
          <p className="text-gray-600">Create a new purchase transaction</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                >
                  <option value="">Select Supplier</option>
                  {/* Options will be populated dynamically */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>

            {/* Products Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Products
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <Select
                      label="Product"
                      options={[{ value: "", label: "Select Product" }]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  + Add Product
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/purchases"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Purchase
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
