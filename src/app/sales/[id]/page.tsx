import DashboardLayout from "@/components/layout/DashboardLayout";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { notFound } from "next/navigation";

interface SaleDetailPageProps {
  params: {
    id: string;
  };
}

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const supabase = createClient();

  const { data: sale, error } = await supabase
    .from("penjualan")
    .select(
      `
      *,
      member:member(nama),
      penjualan_detail(
        id_produk,
        jumlah,
        subtotal,
        produk:produk(nama_produk, harga_jual)
      )
    `
    )
    .eq("id_penjualan", params.id)
    .single();

  if (error || !sale) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/sales"
            className="inline-flex items-center text-green-600 hover:text-green-800 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Sales
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Sale Details</h1>
          <p className="text-gray-600">View sale transaction details</p>
        </div>

        <div className="space-y-6">
          {/* Sale Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sale Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sale ID
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  #{sale.id_penjualan}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <p className="text-gray-900">
                  {new Date(sale.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Member
                </label>
                <p className="text-gray-900">
                  {sale.member?.nama || "Walk-in Customer"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Items
                </label>
                <p className="text-gray-900">{sale.total_item}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Amount
                </label>
                <p className="text-lg font-semibold text-green-600">
                  Rp {sale.total_harga.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Sale Items */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Sale Items
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sale.penjualan_detail?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.produk?.nama_produk}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rp {item.produk?.harga_jual.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.jumlah}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Rp {item.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
