import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { notFound } from "next/navigation";

interface EditSupplierPageProps {
  params: {
    id: string;
  };
}

export default async function EditSupplierPage({
  params,
}: EditSupplierPageProps) {
  const supabase = await createClient();

  const { data: supplier, error } = await supabase
    .from("supplier")
    .select("*")
    .eq("id_supplier", params.id)
    .single();

  if (error || !supplier) {
    notFound();
  }

  return (
    <div className="p-6">
        <div className="mb-6">
          <Link
            href="/suppliers"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Suppliers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Supplier</h1>
          <p className="text-gray-600">Update supplier information</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  defaultValue={supplier.nama}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={supplier.email || ""}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  defaultValue={supplier.telepon || ""}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  defaultValue={supplier.alamat || ""}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter address"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Link
                href="/suppliers"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Supplier
              </button>
            </div>
          </form>
        </div>
      </div>);
}
