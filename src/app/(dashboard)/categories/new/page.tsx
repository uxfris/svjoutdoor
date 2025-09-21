"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";

export default function NewCategoryPage() {
  const [formData, setFormData] = useState({
    nama_kategori: "",
    harga_jual: 0,
    stok: 0,
    kode_kategori: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.from("kategori").insert({
        nama_kategori: formData.nama_kategori,
        harga_jual: formData.harga_jual,
        stok: formData.stok,
        kode_kategori: formData.kode_kategori,
      });

      if (error) throw error;

      router.push("/categories");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.type === "number" ? Number(e.target.value) : e.target.value,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/categories"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Kembali ke Kategori
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Tambah Kategori Baru
        </h1>
        <p className="text-gray-600">
          Buat kategori baru dengan harga dan stok
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Kategori *
            </label>
            <input
              type="text"
              name="nama_kategori"
              required
              value={formData.nama_kategori}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              placeholder="Masukkan nama kategori"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga Jual *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">Rp</span>
              </div>
              <input
                type="number"
                name="harga_jual"
                required
                min="0"
                value={formData.harga_jual}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Stok *
            </label>
            <input
              type="number"
              name="stok"
              required
              min="0"
              value={formData.stok}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kode Kategori *
            </label>
            <input
              type="text"
              name="kode_kategori"
              required
              value={formData.kode_kategori}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              placeholder="Masukkan kode kategori (contoh: CAT001)"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-end space-x-4">
            <Link
              href="/categories"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
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
                  Membuat...
                </>
              ) : (
                "Buat Kategori"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
