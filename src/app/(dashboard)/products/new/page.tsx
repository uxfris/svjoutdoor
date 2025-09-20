"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/Select";
import {
  formInputClass,
  formSelectClass,
  formTextareaClass,
  formLabelClass,
} from "@/lib/form-styles";

export default function NewProductPage() {
  const [formData, setFormData] = useState({
    nama_produk: "",
    merk: "",
    harga_beli: "",
    harga_jual: "",
    stok: "",
    kode_produk: "",
    id_kategori: "",
  });
  const [categories, setCategories] = useState<
    Array<{ id_kategori: number; nama_kategori: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const { data, error } = await supabase
          .from("kategori")
          .select("id_kategori, nama_kategori")
          .order("nama_kategori");

        if (error) throw error;
        setCategories(data || []);
      } catch (error: any) {
        console.error("Error fetching categories:", error);
        setError("Failed to load categories");
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [supabase]);

  // Auto-generate product code
  useEffect(() => {
    const generateProductCode = async () => {
      try {
        const { data, error } = await supabase
          .from("produk")
          .select("id_produk")
          .order("id_produk", { ascending: false })
          .limit(1);

        if (error) throw error;

        const nextId = data && data.length > 0 ? data[0].id_produk + 1 : 1;
        const productCode = `P${nextId.toString().padStart(6, "0")}`;

        setFormData((prev) => ({ ...prev, kode_produk: productCode }));
      } catch (error) {
        console.error("Error generating product code:", error);
      }
    };

    generateProductCode();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.from("produk").insert({
        nama_produk: formData.nama_produk,
        merk: formData.merk || null,
        harga_beli: parseInt(formData.harga_beli),
        harga_jual: parseInt(formData.harga_jual),
        stok: parseInt(formData.stok),
        kode_produk: formData.kode_produk || null,
        id_kategori: parseInt(formData.id_kategori),
      });

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            href="/products"
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Back to Products
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600">Create a new product in your inventory</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="nama_produk" className={formLabelClass}>
                  Product Name *
                </label>
                <input
                  type="text"
                  name="nama_produk"
                  id="nama_produk"
                  required
                  value={formData.nama_produk}
                  onChange={handleChange}
                  className={formInputClass}
                />
              </div>

              <div>
                <label htmlFor="merk" className={formLabelClass}>
                  Brand
                </label>
                <input
                  type="text"
                  name="merk"
                  id="merk"
                  value={formData.merk}
                  onChange={handleChange}
                  className={formInputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="harga_beli" className={formLabelClass}>
                    Buy Price *
                  </label>
                  <input
                    type="number"
                    name="harga_beli"
                    id="harga_beli"
                    required
                    value={formData.harga_beli}
                    onChange={handleChange}
                    className={formInputClass}
                  />
                </div>

                <div>
                  <label htmlFor="harga_jual" className={formLabelClass}>
                    Sell Price *
                  </label>
                  <input
                    type="number"
                    name="harga_jual"
                    id="harga_jual"
                    required
                    value={formData.harga_jual}
                    onChange={handleChange}
                    className={formInputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="stok" className={formLabelClass}>
                    Stock *
                  </label>
                  <input
                    type="number"
                    name="stok"
                    id="stok"
                    required
                    value={formData.stok}
                    onChange={handleChange}
                    className={formInputClass}
                  />
                </div>

                <div>
                  <label htmlFor="kode_produk" className={formLabelClass}>
                    Product Code
                  </label>
                  <input
                    type="text"
                    name="kode_produk"
                    id="kode_produk"
                    value={formData.kode_produk}
                    onChange={handleChange}
                    className={formInputClass}
                  />
                </div>
              </div>

              <div>
                <Select
                  label="Category *"
                  name="id_kategori"
                  id="id_kategori"
                  required
                  value={formData.id_kategori}
                  onChange={handleChange}
                  disabled={categoriesLoading}
                  options={[
                    {
                      value: "",
                      label: categoriesLoading
                        ? "Loading categories..."
                        : "Select a category",
                    },
                    ...categories.map((category) => ({
                      value: category.id_kategori.toString(),
                      label: category.nama_kategori,
                    })),
                  ]}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-[var(--framer-color-border)] rounded-md shadow-sm text-sm font-medium text-[var(--framer-color-text)] bg-[var(--framer-color-bg)] hover:bg-[var(--framer-color-surface)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--framer-color-tint)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--framer-color-tint)] hover:bg-[var(--framer-color-tint-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--framer-color-tint)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                "Create Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
