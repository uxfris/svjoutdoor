import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { notFound } from "next/navigation";

interface PurchaseDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PurchaseDetailPage({
  params,
}: PurchaseDetailPageProps) {
  const supabase = await createClient();

  const { data: purchase, error } = await supabase
    .from("pembelian")
    .select(
      `
      *,
      supplier:supplier(nama),
      pembelian_detail(
        id_produk,
        jumlah,
        subtotal,
        produk:produk(nama_produk, harga_beli)
      )
    `
    )
    .eq("id_pembelian", params.id)
    .single();

  if (error || !purchase) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/purchases"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Purchases
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Purchase Details</h1>
        <p className="text-gray-600">View purchase transaction details</p>
      </div>

      <div className="space-y-6">
        {/* Purchase Information */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Purchase Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Purchase ID
              </label>
              <p className="text-lg font-semibold text-gray-900">
                #{purchase.id_pembelian}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <p className="text-gray-900">
                {new Date(purchase.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Supplier
              </label>
              <p className="text-gray-900">{purchase.supplier?.nama || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Items
              </label>
              <p className="text-gray-900">{purchase.total_item}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Amount
              </label>
              <p className="text-lg font-semibold text-blue-600">
                Rp {purchase.total_harga.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Purchase Items */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Purchase Items
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
                {purchase.pembelian_detail?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.produk?.nama_produk}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Rp {item.produk?.harga_beli.toLocaleString()}
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
  );
}
