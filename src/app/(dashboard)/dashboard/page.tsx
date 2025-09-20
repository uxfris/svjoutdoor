"use client";

import { createClient } from "@/lib/supabase/client";
import {
  CubeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  XMarkIcon as CloseIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

interface RecentSale {
  id_penjualan: number;
  total_item: number;
  total_harga: number;
  created_at: string;
  id_user: string;
  users?: { name: string; level: number } | null;
}

interface SaleDetail {
  id_penjualan: number;
  total_item: number;
  total_harga: number;
  diskon: number;
  bayar: number;
  diterima: number;
  payment_method: string;
  created_at: string;
  member?: { nama: string; kode_member: string } | null;
  users?: { name: string; level: number } | null;
  items: {
    id_produk: number;
    nama_produk: string;
    harga_jual: number;
    jumlah: number;
    diskon: number;
    subtotal: number;
  }[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<RecentSale[]>([]);
  const [allUsers, setAllUsers] = useState<
    { id: string; name: string; level: number }[]
  >([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalMembers: 0,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [loadingSaleId, setLoadingSaleId] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    filterSales();
  }, [recentSales, searchTerm, cashierFilter, dateFilter, amountFilter]);

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return;
      }

      setUser(authUser);

      // Get user profile to check level
      const { data: userProfile } = await supabase
        .from("users")
        .select("level")
        .eq("id", authUser.id)
        .single();

      const adminStatus = userProfile?.level === 1;
      setIsAdmin(adminStatus);

      // Get dashboard statistics
      const [productsResult, salesResult, membersResult] = await Promise.all([
        supabase.from("produk").select("*", { count: "exact", head: true }),
        supabase.from("penjualan").select("*", { count: "exact", head: true }),
        adminStatus
          ? supabase.from("member").select("*", { count: "exact", head: true })
          : { count: 0 },
      ]);

      setStats({
        totalProducts: productsResult.count || 0,
        totalSales: salesResult.count || 0,
        totalMembers: membersResult.count || 0,
      });

      // Get recent sales
      const { data: recentSalesData } = await supabase
        .from("penjualan")
        .select(
          `
          id_penjualan,
          total_item,
          total_harga,
          created_at,
          id_user
        `
        )
        .order("created_at", { ascending: false })
        .limit(20); // Increased limit for better filtering

      // Fetch all users for filtering
      const { data: users } = await supabase
        .from("users")
        .select("id, name, level");

      setAllUsers(users || []);

      // Map users to sales
      if (recentSalesData) {
        const salesWithUsers = recentSalesData.map((sale) => ({
          ...sale,
          users: users?.find((user) => user.id === sale.id_user) || null,
        }));
        setRecentSales(salesWithUsers);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = [...recentSales];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.id_penjualan.toString().includes(searchTerm) ||
          (sale.users?.name || "Unknown")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          sale.total_harga.toString().includes(searchTerm)
      );
    }

    // Cashier filter
    if (cashierFilter !== "all") {
      filtered = filtered.filter((sale) => sale.id_user === cashierFilter);
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

    // Amount filter
    if (amountFilter !== "all") {
      filtered = filtered.filter((sale) => {
        switch (amountFilter) {
          case "low":
            return sale.total_harga < 100000; // Less than 100k
          case "medium":
            return sale.total_harga >= 100000 && sale.total_harga < 500000; // 100k - 500k
          case "high":
            return sale.total_harga >= 500000; // More than 500k
          default:
            return true;
        }
      });
    }

    setFilteredSales(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCashierFilter("all");
    setDateFilter("all");
    setAmountFilter("all");
  };

  const fetchSaleDetails = async (saleId: number) => {
    setLoadingSaleId(saleId);
    setDrawerLoading(true);
    setIsDrawerOpen(true);
    try {
      const supabase = createClient();

      // Get sale data
      const { data: sale, error: saleError } = await supabase
        .from("penjualan")
        .select(
          `
          id_penjualan,
          total_item,
          total_harga,
          diskon,
          bayar,
          diterima,
          payment_method,
          created_at,
          id_member,
          id_user
        `
        )
        .eq("id_penjualan", saleId)
        .single();

      if (saleError) {
        console.error("Error fetching sale:", saleError);
        return;
      }

      // Get member data if exists
      let memberData = null;
      if (sale.id_member) {
        const { data: member } = await supabase
          .from("member")
          .select("nama, kode_member")
          .eq("id_member", sale.id_member)
          .single();
        memberData = member;
      }

      // Get user data
      const { data: userData } = await supabase
        .from("users")
        .select("name, level")
        .eq("id", sale.id_user)
        .single();

      // Get sale details (items)
      const { data: items, error: itemsError } = await supabase
        .from("penjualan_detail")
        .select(
          `
          id_produk,
          harga_jual,
          jumlah,
          diskon,
          subtotal,
          produk(nama_produk)
        `
        )
        .eq("id_penjualan", saleId);

      if (itemsError) {
        console.error("Error fetching sale items:", itemsError);
        return;
      }

      // Format items data
      const formattedItems =
        items?.map((item) => ({
          id_produk: item.id_produk,
          nama_produk: item.produk?.[0]?.nama_produk || "Unknown Product",
          harga_jual: item.harga_jual,
          jumlah: item.jumlah,
          diskon: item.diskon,
          subtotal: item.subtotal,
        })) || [];

      const saleDetail: SaleDetail = {
        ...sale,
        member: memberData,
        users: userData,
        items: formattedItems,
      };

      setSelectedSale(saleDetail);
      setIsDrawerOpen(true);
    } catch (error) {
      console.error("Error fetching sale details:", error);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedSale(null);
    setDrawerLoading(false);
    setLoadingSaleId(null);
  };

  const statsArray = [
    {
      name: "Total Products",
      value: stats.totalProducts,
      icon: CubeIcon,
      color: "bg-[var(--framer-color-tint)]",
    },
    {
      name: "Total Sales",
      value: stats.totalSales,
      icon: CurrencyDollarIcon,
      color: "bg-[var(--framer-color-success)]",
    },
    // Only show member card for administrators
    ...(isAdmin
      ? [
          {
            name: "Total Members",
            value: stats.totalMembers,
            icon: UserGroupIcon,
            color: "bg-[var(--framer-color-tint)]",
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--framer-color-tint)]"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Please log in to view the dashboard.</div>;
  }

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-lg text-slate-600">
              Here's what's happening with your business today
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        className={`grid grid-cols-1 gap-6 mb-8 ${
          isAdmin ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {statsArray.map((stat, index) => (
          <div
            key={stat.name}
            className="group bg-[var(--framer-color-bg)] rounded-[var(--framer-radius-xl)] shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-[var(--framer-color-border)] hover:border-[var(--framer-color-border-hover)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className={`${stat.color} rounded-2xl p-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <stat.icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--framer-color-text-secondary)] mb-1">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-[var(--framer-color-text)]">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sales */}
      <div className="bg-[var(--framer-color-bg)] rounded-[var(--framer-radius-xl)] shadow-md border border-[var(--framer-color-border)] overflow-hidden">
        <div className="px-8 py-6 border-b border-[var(--framer-color-border)] bg-[var(--framer-color-surface)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--framer-color-text)]">
                Recent Sales
              </h2>
              <p className="text-sm text-[var(--framer-color-text-secondary)] mt-1">
                Latest transactions from your store
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-[var(--framer-color-text-tertiary)]">
              <span className="w-2 h-2 bg-[var(--framer-color-success)] rounded-full animate-pulse"></span>
              <span>Live updates</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="px-8 py-4 border-b border-[var(--framer-color-border)] bg-[var(--framer-color-bg)]">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--framer-color-text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search by sale ID, cashier, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[var(--framer-color-border)] rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent bg-[var(--framer-color-bg)] text-[var(--framer-color-text)]"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--framer-color-border)] rounded-lg hover:bg-[var(--framer-color-surface)] transition-colors text-[var(--framer-color-text)]"
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
            </button>

            {/* Clear Filters */}
            {(searchTerm ||
              cashierFilter !== "all" ||
              dateFilter !== "all" ||
              amountFilter !== "all") && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-[var(--framer-color-text-secondary)] hover:text-[var(--framer-color-text)] transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
                Clear
              </button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[var(--framer-color-border)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cashier Filter */}
                <div>
                  <label className="block text-sm font-medium text-[var(--framer-color-text-secondary)] mb-2">
                    Cashier
                  </label>
                  <select
                    value={cashierFilter}
                    onChange={(e) => setCashierFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--framer-color-border)] rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent bg-[var(--framer-color-bg)] text-[var(--framer-color-text)]"
                  >
                    <option value="all">All Cashiers</option>
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-[var(--framer-color-text-secondary)] mb-2">
                    Date Range
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--framer-color-border)] rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent bg-[var(--framer-color-bg)] text-[var(--framer-color-text)]"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                {/* Amount Filter */}
                <div>
                  <label className="block text-sm font-medium text-[var(--framer-color-text-secondary)] mb-2">
                    Amount Range
                  </label>
                  <select
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--framer-color-border)] rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent bg-[var(--framer-color-bg)] text-[var(--framer-color-text)]"
                  >
                    <option value="all">All Amounts</option>
                    <option value="low">Low (&lt; 100k)</option>
                    <option value="medium">Medium (100k - 500k)</option>
                    <option value="high">High (&gt; 500k)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="px-8 py-3 bg-[var(--framer-color-surface)] border-b border-[var(--framer-color-border)]">
          <div className="text-sm text-[var(--framer-color-text-secondary)]">
            Showing {filteredSales.length} of {recentSales.length} sales
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--framer-color-border)]">
            <thead className="bg-[var(--framer-color-surface)]">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                  Sale ID
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                  Cashier
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                  Items
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-[var(--framer-color-text-secondary)] uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--framer-color-bg)] divide-y divide-[var(--framer-color-border)]">
              {filteredSales?.map((sale, index) => (
                <tr
                  key={sale.id_penjualan}
                  className="hover:bg-[var(--framer-color-surface)] transition-colors duration-200"
                >
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[var(--framer-color-tint-disabled)] rounded-[var(--framer-radius-md)] flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-[var(--framer-color-tint)]">
                          #{sale.id_penjualan}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[var(--framer-color-tint-disabled)] rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-[var(--framer-color-tint)]">
                          {sale.users?.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-[var(--framer-color-text)]">
                        {sale.users?.name ||
                          (sale.id_user ? "User Not Found" : "No Cashier")}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <button
                      onClick={() => fetchSaleDetails(sale.id_penjualan)}
                      disabled={loadingSaleId === sale.id_penjualan}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        loadingSaleId === sale.id_penjualan
                          ? "bg-[var(--framer-color-border)] text-[var(--framer-color-text-secondary)] cursor-not-allowed"
                          : "bg-[var(--framer-color-success-bg)] text-[var(--framer-color-success)] hover:bg-[var(--framer-color-success)] hover:text-white cursor-pointer"
                      }`}
                    >
                      {loadingSaleId === sale.id_penjualan ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-[var(--framer-color-text-secondary)] mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        `${sale.total_item} items`
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-[var(--framer-color-text)]">
                      Rp {sale.total_harga.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-[var(--framer-color-text-tertiary)]">
                    {new Date(sale.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!filteredSales || filteredSales.length === 0) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[var(--framer-color-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="w-8 h-8 text-[var(--framer-color-text-tertiary)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--framer-color-text)] mb-2">
              {recentSales.length === 0 ? "No recent sales" : "No sales found"}
            </h3>
            <p className="text-[var(--framer-color-text-secondary)]">
              {recentSales.length === 0
                ? "Start making sales to see them here"
                : "Try adjusting your filters or search terms"}
            </p>
          </div>
        )}
      </div>

      {/* Slide-out Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Clickable area to close drawer */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={closeDrawer}
          />

          {/* Drawer Panel */}
          <div
            className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-[var(--framer-color-bg)] shadow-2xl transform transition-transform duration-300 ease-in-out pointer-events-auto ${
              drawerLoading ? "animate-pulse" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--framer-color-border)] bg-[var(--framer-color-surface)]">
                <div>
                  <h2 className="text-xl font-bold text-[var(--framer-color-text)]">
                    {drawerLoading ? (
                      <div className="flex items-center space-x-2">
                        <span>Loading Sale Details</span>
                        <div className="animate-pulse w-2 h-2 bg-[var(--framer-color-tint)] rounded-full"></div>
                      </div>
                    ) : (
                      `Sale Details #${selectedSale?.id_penjualan}`
                    )}
                  </h2>
                  <p className="text-sm text-[var(--framer-color-text-secondary)]">
                    {drawerLoading
                      ? "Please wait while we fetch the details..."
                      : selectedSale?.created_at
                      ? new Date(selectedSale.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : ""}
                  </p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-2 hover:bg-[var(--framer-color-border)] rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6 text-[var(--framer-color-text-secondary)]" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {drawerLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--framer-color-tint)]"></div>
                    <div className="text-center">
                      <p className="text-[var(--framer-color-text)] font-medium">
                        Loading sale details...
                      </p>
                      <p className="text-[var(--framer-color-text-secondary)] text-sm mt-1">
                        Fetching products and transaction information
                      </p>
                    </div>
                  </div>
                ) : selectedSale ? (
                  <div className="space-y-6">
                    {/* Sale Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-[var(--framer-color-text-secondary)]">
                          Cashier
                        </label>
                        <p className="text-[var(--framer-color-text)] font-medium">
                          {selectedSale.users?.name || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[var(--framer-color-text-secondary)]">
                          Member
                        </label>
                        <p className="text-[var(--framer-color-text)] font-medium">
                          {selectedSale.member?.nama || "Walk-in Customer"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[var(--framer-color-text-secondary)]">
                          Payment Method
                        </label>
                        <p className="text-[var(--framer-color-text)] font-medium capitalize">
                          {selectedSale.payment_method}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[var(--framer-color-text-secondary)]">
                          Total Items
                        </label>
                        <p className="text-[var(--framer-color-text)] font-medium">
                          {selectedSale.total_item}
                        </p>
                      </div>
                    </div>

                    {/* Items List */}
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--framer-color-text)] mb-4">
                        Items
                      </h3>
                      <div className="space-y-3">
                        {selectedSale.items.map((item, index) => (
                          <div
                            key={index}
                            className="bg-[var(--framer-color-surface)] rounded-lg p-4 border border-[var(--framer-color-border)]"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-[var(--framer-color-text)]">
                                  {item.nama_produk}
                                </h4>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-[var(--framer-color-text-secondary)]">
                                  <span>Qty: {item.jumlah}</span>
                                  <span>
                                    Price: Rp {item.harga_jual.toLocaleString()}
                                  </span>
                                  {item.diskon > 0 && (
                                    <span>
                                      Discount: Rp{" "}
                                      {item.diskon.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-[var(--framer-color-text)]">
                                  Rp {item.subtotal.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-[var(--framer-color-surface)] rounded-lg p-4 border border-[var(--framer-color-border)]">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[var(--framer-color-text-secondary)]">
                            Subtotal:
                          </span>
                          <span className="text-[var(--framer-color-text)]">
                            Rp {selectedSale.total_harga.toLocaleString()}
                          </span>
                        </div>
                        {selectedSale.diskon > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[var(--framer-color-text-secondary)]">
                              Discount:
                            </span>
                            <span className="text-[var(--framer-color-text)]">
                              - Rp {selectedSale.diskon.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-[var(--framer-color-text-secondary)]">
                            Amount Paid:
                          </span>
                          <span className="text-[var(--framer-color-text)]">
                            Rp {selectedSale.bayar.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--framer-color-text-secondary)]">
                            Change:
                          </span>
                          <span className="text-[var(--framer-color-text)]">
                            Rp {selectedSale.diterima.toLocaleString()}
                          </span>
                        </div>
                        <div className="border-t border-[var(--framer-color-border)] pt-2">
                          <div className="flex justify-between">
                            <span className="font-semibold text-[var(--framer-color-text)]">
                              Total:
                            </span>
                            <span className="font-bold text-[var(--framer-color-text)] text-lg">
                              Rp {selectedSale.total_harga.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[var(--framer-color-text-secondary)]">
                      No sale details found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
