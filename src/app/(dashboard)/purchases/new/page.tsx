"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "@/components/layout/LoadingContext";

interface Category {
  id_kategori: number;
  nama_kategori: string;
  harga_jual: number;
  stok: number;
}

interface Supplier {
  id_supplier: number;
  nama: string;
}

interface PurchaseItem {
  id_kategori: number;
  nama_kategori: string;
  harga_beli: number;
  jumlah: number;
  subtotal: number;
}

export default function NewPurchasePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { setLoading: setGlobalLoading, endNavigation } = useLoading();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setGlobalLoading(true);
      const [categoriesResult, suppliersResult] = await Promise.all([
        supabase.from("kategori").select("*").order("nama_kategori"),
        supabase.from("supplier").select("*").order("nama"),
      ]);

      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (suppliersResult.data) setSuppliers(suppliersResult.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setGlobalLoading(false);
      endNavigation();
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id_kategori: 0,
        nama_kategori: "",
        harga_beli: 0,
        jumlah: 1,
        subtotal: 0,
      },
    ]);
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "id_kategori") {
      const category = categories.find((cat) => cat.id_kategori === value);
      if (category) {
        newItems[index].nama_kategori = category.nama_kategori;
      }
    }

    if (field === "harga_beli" || field === "jumlah") {
      newItems[index].subtotal =
        newItems[index].harga_beli * newItems[index].jumlah;
    }

    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || items.length === 0) {
      setError("Please select a supplier and add at least one category");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const total = getTotal();
      const totalItems = items.reduce((sum, item) => sum + item.jumlah, 0);

      // Create purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from("pembelian")
        .insert({
          id_supplier: selectedSupplier,
          total_item: totalItems,
          total_harga: total,
          bayar: total,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase details
      const purchaseDetails = items.map((item) => ({
        id_pembelian: purchase.id_pembelian,
        id_kategori: item.id_kategori,
        harga_beli: item.harga_beli,
        jumlah: item.jumlah,
        subtotal: item.subtotal,
      }));

      const { error: detailsError } = await supabase
        .from("pembelian_detail")
        .insert(purchaseDetails);

      if (detailsError) throw detailsError;

      // Update category stock
      for (const item of items) {
        const { error: stockError } = await supabase.rpc(
          "increase_category_stock",
          {
            category_id: item.id_kategori,
            quantity: item.jumlah,
          }
        );

        if (stockError) {
          console.error("Error updating stock:", stockError);
        }
      }

      router.push("/purchases");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier *
              </label>
              <select
                required
                value={selectedSupplier || ""}
                onChange={(e) => setSelectedSupplier(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id_supplier}
                    value={supplier.id_supplier}
                  >
                    {supplier.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date *
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
          </div>

          {/* Categories Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Categories
            </h3>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={item.id_kategori}
                      onChange={(e) =>
                        updateItem(index, "id_kategori", Number(e.target.value))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option
                          key={category.id_kategori}
                          value={category.id_kategori}
                        >
                          {category.nama_kategori}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.jumlah}
                      onChange={(e) =>
                        updateItem(index, "jumlah", Number(e.target.value))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buy Price *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={item.harga_beli}
                      onChange={(e) =>
                        updateItem(index, "harga_beli", Number(e.target.value))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtotal
                    </label>
                    <input
                      type="text"
                      value={`Rp ${item.subtotal.toLocaleString()}`}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-base"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + Add Category
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                Total:
              </span>
              <span className="text-2xl font-bold text-blue-600">
                Rp {getTotal().toLocaleString()}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Link
              href="/purchases"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Creating...
                </>
              ) : (
                "Create Purchase"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
