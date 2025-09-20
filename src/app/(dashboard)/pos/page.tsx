"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
// Note: Using any type for now - these should be properly typed
interface Produk {
  id_produk: number;
  nama_produk: string;
  merk: string;
  harga_jual: number;
  stok: number;
}

interface Member {
  id_member: number;
  nama: string;
  kode_member: string;
}
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 h-full flex flex-col overflow-hidden">
            {/* Products Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Products
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredProducts.length}{" "}
                    {filteredProducts.length === 1 ? "product" : "products"}{" "}
                    available
                  </p>
                </div>
              </div>

              {/* Search Input */}
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? "No products found" : "No products available"}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "Add products to get started"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id_produk}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                            {product.nama_produk}
                          </h3>
                          <p className="text-gray-600 text-xs mb-2">
                            {product.merk}
                          </p>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-blue-600">
                              Rp {product.harga_jual.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            Stock: {product.stok}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Add to cart
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 h-full flex flex-col overflow-hidden">
            {/* Cart Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                      />
                    </svg>
                    Shopping Cart
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {cart.length} {cart.length === 1 ? "item" : "items"} in cart
                  </p>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Clear All
                  </button>
                )}
              </div>

              {/* Customer Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
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

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <svg
                    className="w-16 h-16 text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Add products from the left to get started
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {cart.map((item, index) => (
                    <div
                      key={item.id_produk}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                            {item.nama_produk}
                          </h4>
                          <p className="text-gray-600 text-xs mb-2">
                            Rp {item.harga_jual.toLocaleString()} each
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              Subtotal:{" "}
                              <div>Rp {item.subtotal.toLocaleString()}</div>
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() =>
                              updateQuantity(item.id_produk, item.jumlah - 1)
                            }
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                          <span className="w-10 text-center text-sm font-semibold text-gray-900 bg-white px-2 py-1 rounded border">
                            {item.jumlah}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id_produk, item.jumlah + 1)
                            }
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id_produk)}
                            className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 hover:border-red-300 transition-colors ml-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Section */}
            <div className="bg-gray-50 border-t border-gray-200 p-6">
              {/* Order Summary */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Order Summary
                </h3>

                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Subtotal:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      Rp {getSubtotal().toLocaleString()}
                    </span>
                  </div>

                  {/* Discount Section */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-600">
                        Discount:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between items-center bg-red-50 rounded-md p-2">
                        <span className="text-sm font-medium text-red-700">
                          Discount Amount:
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          -Rp {getDiscountAmount().toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        Total:
                      </span>
                      <span className="text-2xl font-bold text-indigo-600">
                        Rp {getTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Payment Method
                </h3>

                <div className="bg-white rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === "cash"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
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
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">Cash</span>
                      </div>
                    </label>

                    <label
                      className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === "transfer"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
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
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">
                          Transfer
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                  Payment Amount
                </h3>

                <div className="bg-white rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {paymentMethod === "transfer"
                        ? "Transfer Amount"
                        : "Amount Received"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm font-medium">
                          Rp
                        </span>
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
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={
                          paymentMethod === "transfer"
                            ? "Enter transfer amount"
                            : "Enter amount received"
                        }
                      />
                    </div>
                  </div>

                  {/* Quick action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentReceived(getTotal())}
                      className="px-4 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors border border-indigo-200"
                    >
                      Exact Amount
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentReceived(0)}
                      className="px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors border border-gray-200"
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
                        className="px-4 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors border border-green-200"
                      >
                        Round Up
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              {paymentReceived > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Payment Summary
                  </h3>

                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Amount to Pay:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        Rp {getTotal().toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        {paymentMethod === "transfer"
                          ? "Transfer Amount:"
                          : "Amount Received:"}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        Rp {paymentReceived.toLocaleString()}
                      </span>
                    </div>

                    {paymentMethod === "cash" && (
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold text-gray-900">
                            Change:
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              getChange() >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            Rp {getChange().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "transfer" && (
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold text-gray-900">
                            Status:
                          </span>
                          <span
                            className={`text-lg font-bold ${
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
                      </div>
                    )}
                  </div>

                  {/* Transfer Status Alert */}
                  {paymentMethod === "transfer" && (
                    <div
                      className={`rounded-lg p-4 border ${
                        paymentReceived >= getTotal() && paymentReceived > 0
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center">
                        <svg
                          className={`w-5 h-5 mr-3 ${
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
                        <div>
                          <span
                            className={`text-sm font-semibold ${
                              paymentReceived >= getTotal() &&
                              paymentReceived > 0
                                ? "text-green-800"
                                : "text-blue-800"
                            }`}
                          >
                            {paymentReceived >= getTotal() &&
                            paymentReceived > 0
                              ? "Transfer Payment Ready"
                              : "Transfer Payment Required"}
                          </span>
                          <p
                            className={`text-xs mt-1 ${
                              paymentReceived >= getTotal() &&
                              paymentReceived > 0
                                ? "text-green-600"
                                : "text-blue-600"
                            }`}
                          >
                            {paymentReceived >= getTotal() &&
                            paymentReceived > 0
                              ? "Transfer amount is sufficient to complete the transaction"
                              : "Enter the amount customer will transfer"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-red-700 text-sm font-medium">
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {/* Process Sale Button */}
              <button
                onClick={processSale}
                disabled={cart.length === 0 || processing}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
              >
                {processing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Processing Sale...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    Process Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
