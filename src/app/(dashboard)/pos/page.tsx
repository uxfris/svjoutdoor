"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Produk, Member } from "@/lib/database.types";
import { Select } from "@/components/ui/Select";
import { useLoading } from "@/components/layout/LoadingContext";

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
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash"
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const { setLoading: setGlobalLoading, endNavigation } = useLoading();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setGlobalLoading(true);
      const [productsResult, membersResult] = await Promise.all([
        supabase.from("produk").select("*").order("nama_produk"),
        supabase.from("member").select("*").order("nama"),
      ]);

      if (productsResult.data) setProducts(productsResult.data);
      if (membersResult.data) setMembers(membersResult.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setGlobalLoading(false);
      endNavigation();
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

    // Validation for transfer payments
    if (paymentMethod === "transfer" && paymentReceived < getTotal()) {
      setError("Transfer amount must be at least equal to the total amount");
      return;
    }

    // Validation for cash payments
    if (paymentMethod === "cash" && paymentReceived < getTotal()) {
      setError("Insufficient payment received");
      return;
    }

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
            method: paymentMethod,
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

  return (
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
                <Select
                  value={selectedMember?.toString() || ""}
                  onChange={(e) =>
                    setSelectedMember(Number(e.target.value) || null)
                  }
                  options={[
                    { value: "", label: "Walk-in Customer" },
                    ...members.map((member) => ({
                      value: member.id_member.toString(),
                      label: member.nama,
                    })),
                  ]}
                />
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

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">
                    Payment Method:
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={(e) =>
                          setPaymentMethod(
                            e.target.value as "cash" | "transfer"
                          )
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">Cash</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={paymentMethod === "transfer"}
                        onChange={(e) =>
                          setPaymentMethod(
                            e.target.value as "cash" | "transfer"
                          )
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">Transfer</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 min-w-[80px]">
                        Received:
                      </label>
                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">Rp</span>
                        </div>
                        <input
                          type="text"
                          value={
                            paymentReceived > 0
                              ? paymentReceived.toLocaleString()
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            setPaymentReceived(Number(value));
                          }}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={
                            paymentMethod === "transfer"
                              ? "Enter transfer amount"
                              : "Enter amount received"
                          }
                        />
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setPaymentReceived(getTotal())}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        Exact Amount
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentReceived(0)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        Clear
                      </button>
                      {paymentMethod === "cash" && (
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentReceived(
                              Math.ceil(getTotal() / 1000) * 1000
                            )
                          }
                          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                        >
                          Round Up
                        </button>
                      )}
                    </div>
                  </div>

                  {paymentMethod === "transfer" && (
                    <div
                      className={`rounded-lg p-3 border ${
                        paymentReceived >= getTotal() && paymentReceived > 0
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center">
                        <svg
                          className={`w-5 h-5 mr-2 ${
                            paymentReceived >= getTotal() && paymentReceived > 0
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {paymentReceived >= getTotal() &&
                          paymentReceived > 0 ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          )}
                        </svg>
                        <span
                          className={`text-sm font-medium ${
                            paymentReceived >= getTotal() && paymentReceived > 0
                              ? "text-green-800"
                              : "text-blue-800"
                          }`}
                        >
                          {paymentReceived >= getTotal() && paymentReceived > 0
                            ? "Transfer Payment Ready"
                            : "Transfer Payment"}
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          paymentReceived >= getTotal() && paymentReceived > 0
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {paymentReceived >= getTotal() && paymentReceived > 0
                          ? "Transfer amount is sufficient to complete the transaction"
                          : "Enter the amount customer will transfer"}
                      </p>
                    </div>
                  )}

                  {paymentReceived > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Amount to Pay:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          Rp {getTotal().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Received:</span>
                        <span className="text-sm font-medium text-gray-900">
                          Rp {paymentReceived.toLocaleString()}
                        </span>
                      </div>
                      {paymentMethod === "cash" && (
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Change:
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              getChange() >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            Rp {getChange().toLocaleString()}
                          </span>
                        </div>
                      )}
                      {paymentMethod === "transfer" && (
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Status:
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              paymentReceived >= getTotal()
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {paymentReceived >= getTotal()
                              ? "Complete"
                              : "Pending"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {error && (
                <div className="mb-4 text-red-600 text-sm">{error}</div>
              )}
              <button
                onClick={processSale}
                disabled={cart.length === 0 || processing}
                className="w-full bg-[var(--framer-color-tint)] text-white py-2 px-4 rounded-md hover:bg-[var(--framer-color-tint-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
  );
}
