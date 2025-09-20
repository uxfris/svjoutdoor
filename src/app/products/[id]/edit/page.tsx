"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/Select";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const [formData, setFormData] = useState({
    nama_produk: "",
    merk: "",
    harga_beli: "",
    harga_jual: "",
    stok: "",
    kode_produk: "",
    id_kategori: "",
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productResult, categoriesResult] = await Promise.all([
          supabase
            .from("produk")
            .select(
              `
              *,
              kategori:kategori(nama_kategori)
            `
            )
            .eq("id_produk", params.id)
            .single(),
          supabase.from("kategori").select("*").order("nama_kategori"),
        ]);

        if (productResult.error) throw productResult.error;
        if (categoriesResult.error) throw categoriesResult.error;

        const product = productResult.data;
        setFormData({
          nama_produk: product.nama_produk,
          merk: product.merk || "",
          harga_beli: product.harga_beli.toString(),
          harga_jual: product.harga_jual.toString(),
          stok: product.stok.toString(),
          kode_produk: product.kode_produk || "",
          id_kategori: product.id_kategori.toString(),
        });

        setCategories(categoriesResult.data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [params.id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase
        .from("produk")
        .update({
          nama_produk: formData.nama_produk,
          merk: formData.merk || null,
          harga_beli: parseInt(formData.harga_beli),
          harga_jual: parseInt(formData.harga_jual),
          stok: parseInt(formData.stok),
          kode_produk: formData.kode_produk || null,
          id_kategori: parseInt(formData.id_kategori),
        })
        .eq("id_produk", params.id);

      if (error) throw error;

      router.push("/products");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600">Update product information</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="nama_produk"
                  required
                  value={formData.nama_produk}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Code
                </label>
                <input
                  type="text"
                  name="kode_produk"
                  value={formData.kode_produk}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Enter product code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="merk"
                  value={formData.merk}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <Select
                  label="Category *"
                  name="id_kategori"
                  required
                  value={formData.id_kategori}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "Select category" },
                    ...categories.map((category: any) => ({
                      value: category.id_kategori.toString(),
                      label: category.nama_kategori,
                    })),
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buy Price *
                </label>
                <input
                  type="number"
                  name="harga_beli"
                  required
                  min="0"
                  value={formData.harga_beli}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Enter buy price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sell Price *
                </label>
                <input
                  type="number"
                  name="harga_jual"
                  required
                  min="0"
                  value={formData.harga_jual}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Enter sell price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock *
                </label>
                <input
                  type="number"
                  name="stok"
                  required
                  min="0"
                  value={formData.stok}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Enter stock quantity"
                />
              </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex justify-end space-x-4">
              <Link
                href="/products"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                    Updating...
                  </>
                ) : (
                  "Update Product"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
