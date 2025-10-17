"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "@/components/layout/LoadingContext";

interface Category {
  id_kategori: number;
  nama_kategori: string;
  harga_jual: number;
  stok: number;
  kode_kategori: string;
  created_at: string;
  updated_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { setLoading: setGlobalLoading, endNavigation } = useLoading();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setGlobalLoading(true);
      const { data, error } = await supabase
        .from("kategori")
        .select("*")
        .order("nama_kategori");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setGlobalLoading(false);
      endNavigation();
    }
  };

  const handleDelete = async (id: number, name: string) => {
    // Check if there are any sales details using this category
    const { data: salesDetails, error: checkError } = await supabase
      .from("penjualan_detail")
      .select("id_penjualan_detail")
      .eq("id_kategori", id);

    if (checkError) {
      setError(checkError.message);
      return;
    }

    const hasRelatedTransactions = salesDetails && salesDetails.length > 0;

    let confirmMessage = `Apakah Anda yakin ingin menghapus kategori "${name}"?`;
    if (hasRelatedTransactions) {
      confirmMessage += `\n\nPERINGATAN: Kategori ini digunakan dalam ${salesDetails.length} transaksi penjualan. Menghapus kategori ini akan juga menghapus semua detail transaksi yang terkait.`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleting(id);
    setError("");

    try {
      // If there are related sales details, delete them first
      if (hasRelatedTransactions) {
        const { error: deleteDetailsError } = await supabase
          .from("penjualan_detail")
          .delete()
          .eq("id_kategori", id);

        if (deleteDetailsError) throw deleteDetailsError;
      }

      // Now delete the category
      const { error } = await supabase
        .from("kategori")
        .delete()
        .eq("id_kategori", id);

      if (error) throw error;

      // Reload categories
      await loadCategories();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kategori</h1>
          <p className="text-gray-600">Kelola kategori dengan harga dan stok</p>
        </div>
        <Link
          href="/categories/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--framer-color-tint)] hover:bg-[var(--framer-color-tint-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--framer-color-tint)]"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Tambah Kategori
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Daftar Kategori
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dibuat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id_kategori}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{category.id_kategori}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.nama_kategori}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.kode_kategori}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {category.harga_jual.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.stok <= 5
                          ? "bg-red-100 text-red-800"
                          : category.stok <= 20
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {category.stok} unit
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(category.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/categories/${category.id_kategori}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() =>
                          handleDelete(
                            category.id_kategori,
                            category.nama_kategori
                          )
                        }
                        disabled={deleting === category.id_kategori}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deleting === category.id_kategori ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
