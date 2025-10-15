"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
// Note: Using any type for now - these should be properly typed
interface Kategori {
  id_kategori: number;
  nama_kategori: string;
  harga_jual: number;
  stok: number;
  kode_kategori: string;
}

interface Member {
  id_member: number;
  nama: string;
  kode_member: string;
}
import { Select } from "@/components/ui/Select";
import { useLoading } from "@/components/layout/LoadingContext";

interface CartItem {
  id: string; // Unique identifier for each individual item
  id_kategori: number;
  nama_kategori: string;
  harga_jual: number;
  discount: number;
  discountType: "percentage" | "amount";
  quantity: number; // Quantity of this item (currently always 1, but added for future enhancements)
}

export default function POSPage() {
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentReceived, setPaymentReceived] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "debit">("cash");
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

      const [categoriesResult, membersResult] = await Promise.all([
        supabase.from("kategori").select("*").order("nama_kategori"),
        supabase.from("member").select("*").order("nama"),
      ]);

      if (categoriesResult.error) {
        console.error("Categories error:", categoriesResult.error);
        setError(
          `Failed to load categories: ${categoriesResult.error.message}`
        );
      } else {
        setCategories(categoriesResult.data || []);
      }

      if (membersResult.error) {
        console.error("Members error:", membersResult.error);
      } else {
        setMembers(membersResult.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError(
        `Failed to load data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setGlobalLoading(false);
      endNavigation();
    }
  };

  const addToCart = (category: Kategori) => {
    const newItem: CartItem = {
      id: `${category.id_kategori}-${Date.now()}-${Math.random()}`, // Unique ID for each individual item
      id_kategori: category.id_kategori,
      nama_kategori: category.nama_kategori,
      harga_jual: category.harga_jual,
      discount: 0,
      discountType: "percentage",
      quantity: 1, // Each cart item represents one unit
    };

    setCart([...cart, newItem]);
  };

  const updatePrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0 || isNaN(newPrice)) return; // Prevent negative prices and NaN values

    setCart(
      cart.map((item) =>
        item.id === itemId
          ? {
              ...item,
              harga_jual: newPrice,
            }
          : item
      )
    );
  };

  const updateDiscount = (itemId: string, discount: number) => {
    if (discount < 0 || isNaN(discount)) return;

    setCart(
      cart.map((item) =>
        item.id === itemId
          ? {
              ...item,
              discount: discount,
            }
          : item
      )
    );
  };

  const updateDiscountType = (
    itemId: string,
    discountType: "percentage" | "amount"
  ) => {
    setCart(
      cart.map((item) =>
        item.id === itemId
          ? {
              ...item,
              discountType: discountType,
              discount: 0, // Reset discount when changing type
            }
          : item
      )
    );
  };

  const isPriceModified = (item: CartItem) => {
    const originalCategory = categories.find(
      (cat) => cat.id_kategori === item.id_kategori
    );
    return originalCategory && originalCategory.harga_jual !== item.harga_jual;
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const getItemDiscountedPrice = (item: CartItem) => {
    if (item.discountType === "percentage") {
      return item.harga_jual - (item.harga_jual * item.discount) / 100;
    } else {
      return item.harga_jual - item.discount;
    }
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.harga_jual, 0);
  };

  const getTotalDiscount = () => {
    return cart.reduce((sum, item) => {
      const originalPrice = item.harga_jual;
      const discountedPrice = getItemDiscountedPrice(item);
      return sum + (originalPrice - discountedPrice);
    }, 0);
  };

  const getTotal = () => {
    return getSubtotal() - getTotalDiscount();
  };

  const getChange = () => {
    return paymentReceived - getTotal();
  };

  // Helper functions for number formatting
  const formatNumber = (value: number | string): string => {
    if (!value || value === 0) return "";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString("en-US");
  };

  const parseFormattedNumber = (value: string): number => {
    return parseFloat(value.replace(/[^0-9.]/g, "")) || 0; // hapus semua non-digit kecuali titik
  };

  const processSale = async () => {
    if (cart.length === 0) return;

    // Validate payment method
    if (!["cash", "debit"].includes(paymentMethod)) {
      setError("Invalid payment method selected");
      return;
    }

    // Validation for debit payments
    if (paymentMethod === "debit" && paymentReceived < getTotal()) {
      setError("Debit amount must be at least equal to the total amount");
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
      const totalDiscount = getTotalDiscount();
      const paymentData = {
        cart,
        memberId: selectedMember,
        total: getTotal(),
        discount: totalDiscount,
        discountType: "amount", // We're sending the actual discount amount, not percentage
        payment: {
          amount: getTotal(),
          received: paymentReceived || getTotal(),
          method: paymentMethod,
        },
      };

      console.log("POS - Sending payment data:", paymentData);
      console.log("POS - Payment method:", paymentMethod);
      console.log("POS - Payment method type:", typeof paymentMethod);
      console.log("POS - Payment method length:", paymentMethod?.length);
      console.log(
        "POS - Payment method char codes:",
        paymentMethod?.split("").map((c) => c.charCodeAt(0))
      );

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
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

  const filteredCategories = categories.filter((category) =>
    category.nama_kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Categories Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 h-full flex flex-col overflow-hidden">
            {/* Categories Header */}
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
                    Kategori
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredCategories.length}{" "}
                    {filteredCategories.length === 1 ? "kategori" : "kategori"}{" "}
                    tersedia
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
                    placeholder="Cari kategori..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredCategories.length === 0 ? (
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
                    {searchTerm
                      ? "Tidak ada kategori ditemukan"
                      : "Tidak ada kategori tersedia"}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm
                      ? "Coba sesuaikan kata kunci pencarian"
                      : "Tambahkan kategori untuk memulai"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id_kategori}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={() => addToCart(category)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                            {category.nama_kategori}
                          </h3>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-blue-600">
                              Rp {category.harga_jual.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            Stok: {category.stok}
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
                            Tambah
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
                    Keranjang Belanja
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {cart.length} {cart.length === 1 ? "item" : "item"} dalam
                    keranjang
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
                    Hapus Semua
                  </button>
                )}
              </div>

              {/* Customer Selection */}
              <div className="mt-4 hidden">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pelanggan
                </label>
                <Select
                  value={selectedMember?.toString() || ""}
                  onChange={(e) =>
                    setSelectedMember(Number(e.target.value) || null)
                  }
                  options={[
                    { value: "", label: "Pelanggan Langsung" },
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
                    Keranjang Anda kosong
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Tambahkan kategori dari kiri untuk memulai
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {cart.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
                    >
                      <div className="space-y-3">
                        {/* Item Header */}
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                            {item.nama_kategori}
                          </h4>
                          <div className="text-right">
                            <div className="text-lg font-bold text-indigo-600">
                              Rp {getItemDiscountedPrice(item).toLocaleString()}
                            </div>
                            {item.discount > 0 && (
                              <div className="text-xs text-gray-500 line-through">
                                Rp {item.harga_jual.toLocaleString()}
                              </div>
                            )}
                            {item.discount > 0 && (
                              <div className="text-xs text-red-600 font-medium">
                                - Rp{" "}
                                {(
                                  item.harga_jual - getItemDiscountedPrice(item)
                                ).toLocaleString()}
                                {item.discountType === "percentage" &&
                                  ` (${item.discount}%)`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price and Discount Controls */}
                        <div className="space-y-2">
                          {/* Price Input */}
                          <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Harga:
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 text-sm">
                                    Rp
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={formatNumber(item.harga_jual)}
                                  onChange={(e) => {
                                    const newPrice = parseFormattedNumber(
                                      e.target.value
                                    );
                                    updatePrice(item.id, newPrice);
                                  }}
                                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Discount Controls */}
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">
                              Diskon:
                            </label>
                            <div className="flex items-center space-x-2">
                              {/* Discount Type Toggle */}
                              <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDiscountType(item.id, "percentage")
                                  }
                                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                    item.discountType === "percentage"
                                      ? "bg-white text-indigo-600 shadow-sm"
                                      : "text-gray-600 hover:text-gray-900"
                                  }`}
                                >
                                  %
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDiscountType(item.id, "amount")
                                  }
                                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                    item.discountType === "amount"
                                      ? "bg-white text-indigo-600 shadow-sm"
                                      : "text-gray-600 hover:text-gray-900"
                                  }`}
                                >
                                  Rp
                                </button>
                              </div>

                              {/* Discount Input */}
                              <div className="flex-1">
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 text-sm">
                                      {item.discountType === "percentage"
                                        ? "%"
                                        : "Rp"}
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={
                                      item.discountType === "percentage"
                                        ? item.discount || ""
                                        : formatNumber(item.discount)
                                    }
                                    onChange={(e) => {
                                      const value =
                                        item.discountType === "percentage"
                                          ? Number(e.target.value) || 0
                                          : parseFormattedNumber(
                                              e.target.value
                                            );
                                      updateDiscount(item.id, value);
                                    }}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <div className="flex justify-end">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="px-3 py-2 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors border border-red-200"
                              title="Hapus item"
                            >
                              <svg
                                className="w-3 h-3"
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
                  Ringkasan Pesanan
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

                  {getTotalDiscount() > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Diskon:
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        - Rp {getTotalDiscount().toLocaleString()}
                      </span>
                    </div>
                  )}

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
              <div className="space-y-2 mb-4">
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
                  Metode Pembayaran
                </h3>

                <div className="bg-white rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`relative flex items-center justify-center p-2 border-2 rounded-md cursor-pointer transition-all ${
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
                          setPaymentMethod(e.target.value as "cash" | "debit")
                        }
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-1">
                        <svg
                          className="w-4 h-4 text-gray-600"
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
                        <span className="text-sm font-medium text-gray-900">
                          Tunai
                        </span>
                      </div>
                    </label>

                    <label
                      className={`relative flex items-center justify-center p-2 border-2 rounded-md cursor-pointer transition-all ${
                        paymentMethod === "debit"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="debit"
                        checked={paymentMethod === "debit"}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as "cash" | "debit")
                        }
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-1">
                        <svg
                          className="w-4 h-4 text-gray-600"
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
                        <span className="text-sm font-medium text-gray-900">
                          Debit
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
                  Jumlah Pembayaran
                </h3>

                <div className="bg-white rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {paymentMethod === "debit"
                        ? "Jumlah Debit"
                        : "Jumlah Diterima"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">Rp</span>
                      </div>
                      <input
                        type="text"
                        value={formatNumber(paymentReceived)}
                        onChange={(e) => {
                          const value = parseFormattedNumber(e.target.value);
                          setPaymentReceived(value);
                        }}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={
                          paymentMethod === "debit"
                            ? "Masukkan jumlah debit"
                            : "Masukkan jumlah diterima"
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
                      Jumlah Tepat
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentReceived(0)}
                      className="px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors border border-gray-200"
                    >
                      Hapus
                    </button>
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
                    Ringkasan Pembayaran
                  </h3>
                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Jumlah yang Harus Dibayar:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        Rp {getTotal().toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        {paymentMethod === "debit"
                          ? "Jumlah Debit:"
                          : "Jumlah Diterima:"}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        Rp {paymentReceived.toLocaleString()}
                      </span>
                    </div>

                    {paymentMethod === "cash" && (
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold text-gray-900">
                            Kembalian:
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

                    {paymentMethod === "debit" && (
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
                              ? "Selesai"
                              : "Menunggu"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* {paymentMethod === "debit" && (
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
                              ? "Debit Payment Ready"
                              : "Debit Payment Required"}
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
                              ? "Debit amount is sufficient to complete the transaction"
                              : "Enter the amount customer will pay via debit"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )} */}
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
                disabled={
                  cart.length === 0 ||
                  processing ||
                  paymentReceived <= 0 ||
                  getChange() < 0
                }
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
                    Memproses Penjualan...
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
                    Proses Penjualan
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
