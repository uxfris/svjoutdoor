"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { createClient } from "@/lib/supabase/client";
import { Produk, Member } from "@/lib/database.types";

interface CartItem {
  id_produk: number;
  nama_produk: string;
  harga_jual: number;
  jumlah: number;
  subtotal: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Produk[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentReceived, setPaymentReceived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsResult, membersResult] = await Promise.all([
        supabase.from("produk").select("*").order("nama_produk"),
        supabase.from("member").select("*").order("nama"),
      ]);

      if (productsResult.data) setProducts(productsResult.data);
      if (membersResult.data) setMembers(membersResult.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Produk) => {
    const existingItem = cart.find(
      (item) => item.id_produk === product.id_produk
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id_produk === product.id_produk
            ? {
                ...item,
                jumlah: item.jumlah + 1,
                subtotal: (item.jumlah + 1) * item.harga_jual,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id_produk: product.id_produk,
          nama_produk: product.nama_produk,
          harga_jual: product.harga_jual,
          jumlah: 1,
          subtotal: product.harga_jual,
        },
      ]);
    }
  };

  const updateQuantity = (id_produk: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.id_produk !== id_produk));
    } else {
      setCart(
        cart.map((item) =>
          item.id_produk === id_produk
            ? {
                ...item,
                jumlah: quantity,
                subtotal: quantity * item.harga_jual,
              }
            : item
        )
      );
    }
  };

  const removeFromCart = (id_produk: number) => {
    setCart(cart.filter((item) => item.id_produk !== id_produk));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getDiscountAmount = () => {
    return (getSubtotal() * discount) / 100;
  };

  const getTotal = () => {
    return getSubtotal() - getDiscountAmount();
  };

  const getChange = () => {
    return paymentReceived - getTotal();
  };

  const processSale = async () => {
    if (cart.length === 0) return;

    setProcessing(true);
    setError("");

    try {
      const total = getTotal();
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart,
          memberId: selectedMember,
          total: getTotal(),
          discount,
          payment: {
            amount: getTotal(),
            received: paymentReceived || getTotal(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process sale");
      }

      const result = await response.json();
      console.log("Sale created successfully:", result);

      // Redirect to completion page with sale ID
      window.location.href = `/pos/complete?id=${result.id_penjualan}`;
    } catch (error: any) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.nama_produk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
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
      <div className="p-6 h-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600">Process sales transactions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow h-full">
              <div className="p-4 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="p-4 overflow-y-auto h-96">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id_produk}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <h3 className="font-medium text-gray-900 truncate">
                        {product.nama_produk}
                      </h3>
                      <p className="text-sm text-gray-500">{product.merk}</p>
                      <p className="text-lg font-semibold text-indigo-600 mt-2">
                        Rp {product.harga_jual.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        Stock: {product.stok}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
                <div className="mt-2">
                  <select
                    value={selectedMember || ""}
                    onChange={(e) =>
                      setSelectedMember(Number(e.target.value) || null)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Walk-in Customer</option>
                    {members.map((member) => (
                      <option key={member.id_member} value={member.id_member}>
                        {member.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center">Cart is empty</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.id_produk}
                        className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {item.nama_produk}
                          </h4>
                          <p className="text-gray-500 text-xs">
                            Rp {item.harga_jual.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id_produk, item.jumlah - 1)
                            }
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.jumlah}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id_produk, item.jumlah + 1)
                            }
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id_produk)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm text-gray-900">
                      Rp {getSubtotal().toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Discount:</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Discount Amount:
                      </span>
                      <span className="text-sm text-red-600">
                        -Rp {getDiscountAmount().toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-lg font-semibold text-gray-900">
                      Total:
                    </span>
                    <span className="text-xl font-bold text-indigo-600">
                      Rp {getTotal().toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Received:</label>
                    <input
                      type="number"
                      min="0"
                      value={paymentReceived}
                      onChange={(e) =>
                        setPaymentReceived(Number(e.target.value))
                      }
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="0"
                    />
                  </div>

                  {paymentReceived > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Change:</span>
                      <span
                        className={`text-sm font-semibold ${
                          getChange() >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        Rp {getChange().toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                {error && (
                  <div className="mb-4 text-red-600 text-sm">{error}</div>
                )}
                <button
                  onClick={processSale}
                  disabled={cart.length === 0 || processing}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
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
                      Processing...
                    </>
                  ) : (
                    "Process Sale"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
