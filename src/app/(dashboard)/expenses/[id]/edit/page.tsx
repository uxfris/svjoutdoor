import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { notFound } from "next/navigation";

interface EditExpensePageProps {
  params: {
    id: string;
  };
}

export default async function EditExpensePage({
  params,
}: EditExpensePageProps) {
  const supabase = await createClient();

  const { data: expense, error } = await supabase
    .from("pengeluaran")
    .select("*")
    .eq("id_pengeluaran", params.id)
    .single();

  if (error || !expense) {
    notFound();
  }

  return (
    <div className="p-6">
        <div className="mb-6">
          <Link
            href="/expenses"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Expenses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Expense</h1>
          <p className="text-gray-600">Update expense information</p>
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
                  defaultValue={expense.deskripsi}
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
                  defaultValue={expense.nominal}
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
                  defaultValue={expense.created_at.split("T")[0]}
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
                Update Expense
              </button>
            </div>
          </form>
        </div>
      </div>);
}
