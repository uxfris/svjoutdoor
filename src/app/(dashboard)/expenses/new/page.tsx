import Link from "next/link";

export default function NewExpensePage() {
  return (
    <div className="p-6">
        <div className="mb-6">
          <Link
            href="/expenses"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Expenses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Expense</h1>
          <p className="text-gray-600">Record a new business expense</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter expense description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Link
                href="/expenses"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Expense
              </button>
            </div>
          </form>
        </div>
      </div>);
}
