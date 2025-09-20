"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { PrintService, PrintBarcodeData } from "@/lib/print-service";
import { useLoading } from "@/components/layout/LoadingContext";
import NavigationLink from "@/components/ui/NavigationLink";

interface Product {
  id_produk: number;
  id_kategori: number;
  nama_produk: string;
  merk: string | null;
  harga_beli: number;
  diskon: number;
  harga_jual: number;
  stok: number;
  kode_produk: string | null;
  created_at: string;
  updated_at: string;
  kategori: {
    nama_kategori: string;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { setLoading: setGlobalLoading, endNavigation } = useLoading();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setGlobalLoading(true);
      const { data, error } = await supabase
        .from("produk")
        .select(
          `
          *,
          kategori:kategori(nama_kategori)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setGlobalLoading(false);
      endNavigation();
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) {
      return;
    }

    setDeleting(id);
    setError("");

    try {
      const { error } = await supabase
        .from("produk")
        .delete()
        .eq("id_produk", id);

      if (error) throw error;

      // Reload products
      await loadProducts();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map((p) => p.id_produk));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, id]);
    } else {
      setSelectedProducts(selectedProducts.filter((p) => p !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedProducts.length} selected products?`
      )
    ) {
      return;
    }

    setDeleting(-1);
    setError("");

    try {
      const { error } = await supabase
        .from("produk")
        .delete()
        .in("id_produk", selectedProducts);

      if (error) throw error;

      setSelectedProducts([]);
      await loadProducts();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handlePrintBarcodes = async () => {
    if (selectedProducts.length === 0) {
      alert("Please select products to print barcodes");
      return;
    }

    setPrinting(true);
    setError("");

    try {
      const selectedProductsData = products
        .filter((p) => selectedProducts.includes(p.id_produk))
        .map((p) => ({
          id_produk: p.id_produk,
          nama_produk: p.nama_produk,
          kode_produk:
            p.kode_produk || `P${p.id_produk.toString().padStart(6, "0")}`,
          harga_jual: p.harga_jual,
        }));

      await PrintService.printBarcodes(selectedProductsData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <div className="flex space-x-2">
          {selectedProducts.length > 0 && (
            <>
              <button
                onClick={handlePrintBarcodes}
                disabled={printing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <PrinterIcon className="w-5 h-5 mr-2" />
                {printing
                  ? "Printing..."
                  : `Print Barcodes (${selectedProducts.length})`}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting === -1}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <TrashIcon className="w-5 h-5 mr-2" />
                {deleting === -1
                  ? "Deleting..."
                  : `Delete (${selectedProducts.length})`}
              </button>
            </>
          )}
          <NavigationLink
            href="/products/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Product
          </NavigationLink>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Product List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={
                      selectedProducts.length === products.length &&
                      products.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products?.map((product) => (
                <tr key={product.id_produk}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id_produk)}
                      onChange={(e) =>
                        handleSelectProduct(product.id_produk, e.target.checked)
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.nama_produk}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.merk && `Brand: ${product.merk}`}
                      </div>
                      {product.kode_produk && (
                        <div className="text-xs text-gray-400">
                          Code: {product.kode_produk}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.kategori?.nama_kategori}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Buy: Rp {product.harga_beli.toLocaleString()}</div>
                    <div className="font-medium">
                      Sell: Rp {product.harga_jual.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stok > 10
                          ? "bg-green-100 text-green-800"
                          : product.stok > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.stok} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <NavigationLink
                        href={`/products/${product.id_produk}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </NavigationLink>
                      <button
                        onClick={() =>
                          handleDelete(product.id_produk, product.nama_produk)
                        }
                        disabled={deleting === product.id_produk}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deleting === product.id_produk ? (
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
