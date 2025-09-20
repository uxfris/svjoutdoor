import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { notFound } from "next/navigation";

interface EditUserPageProps {
  params: {
    id: string;
  };
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !user) {
    notFound();
  }

  return (
    <div className="p-6">
        <div className="mb-6">
          <Link
            href="/users"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-600">Update user information</p>
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
                  defaultValue={user.full_name || ""}
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
                  defaultValue={user.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  required
                  defaultValue={user.role || "user"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                >
                  <option value="admin">Admin</option>
                  <option value="cashier">Cashier</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <input
                  type="number"
                  min="1"
                  max="2"
                  defaultValue={user.level || 1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter user level"
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
                Update User
              </button>
            </div>
          </form>
        </div>
      </div>);
}
