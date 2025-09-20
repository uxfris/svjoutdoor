"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface Sale {
  id_penjualan: number;
  total_item: number;
  total_harga: number;
  payment_method: string;
  created_at: string;
  member?: { nama: string };
  users?: { name: string; level: number };
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, paymentFilter, dateFilter]);

  const fetchSales = async () => {
    try {
      const supabase = createClient();

      // First, let's check the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      console.log("Current user:", user);
      console.log("User error:", userError);

      // Check user profile and level
      if (user) {
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("name, level")
          .eq("id", user.id)
          .single();
        console.log("User profile:", userProfile);
        console.log("Profile error:", profileError);
      }

      // First, let's check raw sales data without joins
      const { data: rawSales, error: rawError } = await supabase
        .from("penjualan")
        .select("id_penjualan, id_user, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      console.log("Raw sales data (first 5):", rawSales);
      console.log("Raw sales error:", rawError);

      const { data, error } = await supabase
        .from("penjualan")
        .select(
          `
          *,
          member:member(nama),
          users:users!id_user(name, level)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching sales:", error);
      } else {
        console.log("Fetched sales data:", data);
        console.log("Sample sale with user data:", data?.[0]);

        // If we have sales but no user data, let's try to fetch user data separately
        if (data && data.length > 0 && !data[0].users) {
          console.log("No user data in join, trying to fetch separately...");
          const userIds = [
            ...new Set(data.map((sale) => sale.id_user).filter(Boolean)),
          ];
          console.log("User IDs found in sales:", userIds);

          if (userIds.length > 0) {
            const { data: users, error: usersError } = await supabase
              .from("users")
              .select("id, name, level")
              .in("id", userIds);

            console.log("Fetched users separately:", users);
            console.log("Users error:", usersError);

            // Let's also check what users actually exist in the database
            // First try with RLS, then try with service role if needed
            const { data: allUsers, error: allUsersError } = await supabase
              .from("users")
              .select("id, name, level")
              .limit(10);

            console.log("All users in database (with RLS):", allUsers);
            console.log("All users error:", allUsersError);

            // If RLS is blocking us, let's try to get the specific user we need
            if (allUsersError || !allUsers || allUsers.length === 0) {
              console.log(
                "RLS might be blocking user access, trying individual queries..."
              );
              for (const userId of userIds) {
                const { data: singleUser, error: singleUserError } =
                  await supabase
                    .from("users")
                    .select("id, name, level")
                    .eq("id", userId)
                    .single();
                console.log(`User ${userId}:`, singleUser, singleUserError);
              }
            }

            // Map users back to sales
            const salesWithUsers = data.map((sale) => ({
              ...sale,
              users: users?.find((user) => user.id === sale.id_user) || null,
            }));

            setSales(salesWithUsers);
          } else {
            setSales(data);
          }
        } else {
          setSales(data || []);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = [...sales];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.id_penjualan.toString().includes(searchTerm) ||
          (sale.member?.nama || "Walk-in Customer")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (sale.users?.name || "Unknown")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Payment method filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(
        (sale) => sale.payment_method === paymentFilter
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date(today);
      thisMonth.setMonth(thisMonth.getMonth() - 1);

      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.created_at);
        switch (dateFilter) {
          case "today":
            return saleDate >= today;
          case "yesterday":
            return saleDate >= yesterday && saleDate < today;
          case "week":
            return saleDate >= thisWeek;
          case "month":
            return saleDate >= thisMonth;
          default:
            return true;
        }
      });
    }

    setFilteredSales(filtered);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--framer-color-tint)]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">View all sales transactions</p>
        </div>
        <Link
          href="/pos"
          className="bg-[var(--framer-color-success)] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          New Sale
        </Link>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by sale ID, member, or cashier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredSales.length} of {sales.length} sales
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cashier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales?.map((sale) => (
                <tr key={sale.id_penjualan}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{sale.id_penjualan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {sale.users?.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {sale.users?.name ||
                          (sale.id_user ? "User Not Found" : "No Cashier")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600">
                          {(sale.member?.nama || "Walk-in Customer")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      {sale.member?.nama || "Walk-in Customer"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {sale.total_item} items
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    Rp {sale.total_harga.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sale.payment_method === "cash"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {sale.payment_method === "cash" ? "Cash" : "Transfer"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sale.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Link
                        href={`/sales/${sale.id_penjualan}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View
                      </Link>
                      <button className="text-red-600 hover:text-red-900 font-medium">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No sales found
            </h3>
            <p className="text-gray-500">
              {searchTerm || paymentFilter !== "all" || dateFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "No sales have been recorded yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
