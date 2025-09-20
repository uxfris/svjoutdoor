import Link from "next/link";
import { Select } from "@/components/ui/Select";

export default function NewUserPage() {
  return (
    <div className="p-6">
        <div className="mb-6">
          <Link
            href="/users"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
          <p className="text-gray-600">Create a new system user</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <Select
                  label="Role *"
                  required
                  options={[
                    { value: "", label: "Select Role" },
                    { value: "admin", label: "Admin" },
                    { value: "cashier", label: "Cashier" },
                    { value: "user", label: "User" },
                  ]}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Link
                href="/users"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>);
}
