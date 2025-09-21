"use client";

import { createClient } from "@/lib/supabase/client";
import { useDataCache } from "@/hooks/useDataCache";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { SalesByCategory } from "@/components/dashboard/SalesByCategory";
import { LazyWrapper } from "@/components/ui/LazyWrapper";
import { RecentSale } from "@/lib/database.types";
import {
  TagIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";

// Lazy load the drawer component
const SaleDetailsDrawer = dynamic(
  () =>
    import("@/components/dashboard/SaleDetailsDrawer").then((mod) => ({
      default: mod.SaleDetailsDrawer,
    })),
  { ssr: false }
);

interface SaleDetail {
  id_penjualan: number;
  total_item: number;
  total_harga: number;
  diskon: number;
  discount_type: "percentage" | "amount";
  bayar: number;
  diterima: number;
  payment_method: string;
  created_at: string;
  member?: { nama: string; kode_member: string } | null;
  users?: { name: string; level: number } | null;
  items: {
    id_kategori: number;
    nama_kategori: string;
    harga_jual: number;
    jumlah: number;
    diskon: number;
    discount_type: "percentage" | "amount";
    subtotal: number;
  }[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [allUsers, setAllUsers] = useState<
    { id: string; name: string; level: number }[]
  >([]);
  const [allCategories, setAllCategories] = useState<
    { id_kategori: number; nama_kategori: string }[]
  >([]);
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalSales: 0,
    totalMembers: 0,
    // Cashier-specific stats
    todaySales: 0,
    todayRevenue: 0,
    myTotalSales: 0,
  });

  // Cashier performance stats for admin
  const [cashierStats, setCashierStats] = useState<{
    [cashierId: string]: {
      name: string;
      totalSales: number;
      totalRevenue: number;
      totalCash: number;
      totalDebit: number;
    };
  }>({});
  const [cashierStatsLoading, setCashierStatsLoading] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [cashierTimeFilter, setCashierTimeFilter] = useState("today");
  const [categoryTimeFilter, setCategoryTimeFilter] = useState("today");

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [loadingSaleId, setLoadingSaleId] = useState<number | null>(null);

  // Cache hooks
  const { fetchData: fetchDashboardStats } = useDataCache(
    "dashboard-stats",
    async () => {
      const supabase = createClient();

      if (isAdmin) {
        // Admin stats - business overview
        const [categoriesResult, salesResult, membersResult] =
          await Promise.all([
            supabase
              .from("kategori")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("penjualan")
              .select("*", { count: "exact", head: true }),
            supabase.from("member").select("*", { count: "exact", head: true }),
          ]);

        return {
          totalCategories: categoriesResult.count || 0,
          totalSales: salesResult.count || 0,
          totalMembers: membersResult.count || 0,
          todaySales: 0,
          todayRevenue: 0,
          myTotalSales: 0,
        };
      } else {
        // Cashier stats - personal performance
        const today = new Date();
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const [categoriesResult, todaySalesResult, mySalesResult] =
          await Promise.all([
            supabase
              .from("kategori")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("penjualan")
              .select("total_harga", { count: "exact" })
              .eq("id_user", user?.id)
              .gte("created_at", todayStart.toISOString())
              .lt("created_at", todayEnd.toISOString()),
            supabase
              .from("penjualan")
              .select("total_harga", { count: "exact" })
              .eq("id_user", user?.id),
          ]);

        const todayRevenue =
          todaySalesResult.data?.reduce(
            (sum, sale) => sum + sale.total_harga,
            0
          ) || 0;

        return {
          totalCategories: categoriesResult.count || 0,
          totalSales: 0,
          totalMembers: 0,
          todaySales: todaySalesResult.count || 0,
          todayRevenue,
          myTotalSales: mySalesResult.count || 0,
        };
      }
    },
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  const { fetchData: fetchRecentSales } = useDataCache(
    `recent-sales-${user?.id || "no-user"}-${isAdmin}`,
    async () => {
      try {
        if (!user) {
          return [];
        }

        const supabase = createClient();

        // Get sales with category information from sale details
        let salesQuery = supabase
          .from("penjualan")
          .select(
            `
            id_penjualan,
            total_item,
            total_harga,
            created_at,
            id_user,
            penjualan_detail(
              id_kategori,
              kategori(nama_kategori)
            )
          `
          )
          .order("created_at", { ascending: false })
          .limit(20);

        if (!isAdmin) {
          salesQuery = salesQuery.eq("id_user", user.id);
        }

        const { data: recentSalesData, error: salesError } = await salesQuery;

        if (salesError) {
          console.error("Error fetching recent sales:", salesError);
          return [];
        }

        // Get all users for manual join (including admins for display purposes)
        const { data: allUsersData, error: allUsersError } = await supabase
          .from("users")
          .select("id, name, level");

        if (allUsersError) {
          console.error("Error fetching users:", allUsersError);
        }

        // Process data with manual user join
        const processedSales =
          recentSalesData?.map((sale: any) => {
            // Find user data manually
            const userData =
              sale.id_user && allUsersData
                ? allUsersData.find((user: any) => user.id === sale.id_user) ||
                  null
                : null;

            return {
              ...sale,
              users: userData,
            };
          }) || [];

        return processedSales;
      } catch (error) {
        console.error("Exception in fetchRecentSales:", error);
        return [];
      }
    },
    { ttl: 30 * 1000 }
  );

  const { fetchData: fetchCashierStats } = useDataCache(
    `cashier-stats-${cashierTimeFilter}`,
    async () => {
      const supabase = createClient();

      if (!isAdmin) {
        return {};
      }

      // Calculate date range based on filter
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate: Date;
      let endDate: Date;

      switch (cashierTimeFilter) {
        case "today":
          startDate = new Date(today);
          endDate = new Date(today);
          endDate.setDate(endDate.getDate() + 1);
          break;
        case "yesterday":
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 1);
          endDate = new Date(today);
          break;
        case "week":
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 7);
          endDate = new Date(today);
          endDate.setDate(endDate.getDate() + 1);
          break;
        case "month":
          startDate = new Date(today);
          startDate.setMonth(startDate.getMonth() - 1);
          endDate = new Date(today);
          endDate.setDate(endDate.getDate() + 1);
          break;
        default:
          startDate = new Date(0); // All time
          endDate = new Date();
      }

      // Get all sales in the date range
      let query = supabase
        .from("penjualan")
        .select("id_user, total_harga, payment_method, created_at");

      // Only apply date filters if not "all time"
      if (cashierTimeFilter !== "all") {
        query = query
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString());
      }

      const { data: salesData, error: salesError } = await query;

      if (salesError) {
        console.error("Error fetching sales data:", salesError);
        return {};
      }

      // Get only cashier users (level 2), exclude admins (level 1)
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name, level")
        .eq("level", 2); // Only get cashiers, not admins

      if (usersError) {
        console.error("Error fetching users data:", usersError);
        return {};
      }

      if (!salesData || !usersData) {
        return {};
      }

      // Calculate stats per cashier (only level 2 users)
      const stats: {
        [key: string]: {
          name: string;
          totalSales: number;
          totalRevenue: number;
          totalCash: number;
          totalDebit: number;
        };
      } = {};

      usersData.forEach((user) => {
        const userSales = salesData.filter((sale) => sale.id_user === user.id);
        const cashSales = userSales.filter(
          (sale) => sale.payment_method === "cash"
        );
        const debitSales = userSales.filter(
          (sale) => sale.payment_method === "debit"
        );

        stats[user.id] = {
          name: user.name,
          totalSales: userSales.length,
          totalRevenue: userSales.reduce(
            (sum, sale) => sum + sale.total_harga,
            0
          ),
          totalCash: cashSales.reduce((sum, sale) => sum + sale.total_harga, 0),
          totalDebit: debitSales.reduce(
            (sum, sale) => sum + sale.total_harga,
            0
          ),
        };
      });

      return stats;
    },
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  // Memoized filtered sales computation
  const filteredSales = useMemo(() => {
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

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((sale) => {
        if (!sale.penjualan_detail || sale.penjualan_detail.length === 0) {
          return false;
        }
        return sale.penjualan_detail.some(
          (detail) => detail.id_kategori.toString() === categoryFilter
        );
      });
    }

    return filtered;
  }, [
    recentSales,
    searchTerm,
    cashierFilter,
    dateFilter,
    amountFilter,
    categoryFilter,
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refetch recent sales when user or admin status changes
  useEffect(() => {
    if (user && isAdmin !== null) {
      fetchRecentSales().then((data) => {
        if (data && data.length > 0) {
          setRecentSales(data);
        } else {
          setRecentSales([]);
        }
      });
    }
  }, [user, isAdmin, fetchRecentSales]);

  // Refetch cashier stats when time filter changes
  useEffect(() => {
    if (isAdmin) {
      setCashierStatsLoading(true);
      fetchCashierStats()
        .then((data) => {
          setCashierStats(data);
          setCashierStatsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching cashier stats:", error);
          setCashierStatsLoading(false);
        });
    }
  }, [cashierTimeFilter, isAdmin, fetchCashierStats]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        return;
      }

      if (!authUser) {
        return;
      }

      setUser(authUser);

      // Get user profile to check level
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("level")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
      }

      const adminStatus = userProfile?.level === 1;
      setIsAdmin(adminStatus);

      // Wait a bit for state to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch data using cache
      const [statsData, usersData, categoriesData] = await Promise.all([
        fetchDashboardStats(),
        supabase.from("users").select("id, name, level").eq("level", 2), // Only get cashiers
        supabase
          .from("kategori")
          .select("id_kategori, nama_kategori")
          .order("nama_kategori"),
      ]);

      setStats(statsData);
      setAllUsers(usersData.data || []);
      setAllCategories(categoriesData.data || []);

      // Fetch recent sales after user and admin status are set
      const recentSalesData = await fetchRecentSales();

      // Set recent sales data (already processed in fetchRecentSales)
      if (recentSalesData && recentSalesData.length > 0) {
        setRecentSales(recentSalesData);
      } else {
        setRecentSales([]);
      }

      // Fetch cashier stats for admin
      if (adminStatus) {
        const cashierStatsData = await fetchCashierStats();
        setCashierStats(cashierStatsData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardStats, fetchRecentSales, fetchCashierStats]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setCashierFilter("all");
    setDateFilter("all");
    setAmountFilter("all");
    setCategoryFilter("all");
  }, []);

  const fetchSaleDetails = useCallback(async (saleId: number) => {
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
          discount_type,
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
          id_kategori,
          harga_jual,
          jumlah,
          diskon,
          discount_type,
          subtotal,
          kategori(nama_kategori)
        `
        )
        .eq("id_penjualan", saleId);

      if (itemsError) {
        console.error("Error fetching sale items:", itemsError);
        return;
      }

      // Format items data
      const formattedItems =
        items?.map((item: any) => ({
          id_kategori: item.id_kategori,
          nama_kategori: item.kategori?.nama_kategori || "Unknown Category",
          harga_jual: item.harga_jual,
          jumlah: item.jumlah,
          diskon: item.diskon,
          discount_type: item.discount_type,
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
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedSale(null);
    setDrawerLoading(false);
    setLoadingSaleId(null);
  }, []);

  const statsArray = useMemo(() => {
    if (isAdmin) {
      // Admin dashboard - business overview (hiding member card)
      return [
        {
          name: "Total Categories",
          value: stats.totalCategories,
          icon: TagIcon,
          color: "bg-[var(--framer-color-tint)]",
        },
        {
          name: "Total Sales",
          value: stats.totalSales,
          icon: CurrencyDollarIcon,
          color: "bg-[var(--framer-color-success)]",
        },
      ];
    } else {
      // Cashier dashboard - personal performance
      return [
        {
          name: "Today's Sales",
          value: stats.todaySales,
          icon: CurrencyDollarIcon,
          color: "bg-[var(--framer-color-success)]",
        },
        {
          name: "Today's Revenue",
          value: `Rp ${stats.todayRevenue.toLocaleString()}`,
          icon: CurrencyDollarIcon,
          color: "bg-[var(--framer-color-tint)]",
        },
        {
          name: "My Total Sales",
          value: stats.myTotalSales,
          icon: UserGroupIcon,
          color: "bg-[var(--framer-color-tint)]",
        },
      ];
    }
  }, [stats, isAdmin]);

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
              {isAdmin ? "Welcome back!" : "Good day!"}
            </h1>
            <p className="text-lg text-slate-600">
              {isAdmin
                ? "Here's what's happening with your business today"
                : "Here's your sales performance and recent transactions"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
        {statsArray.map((stat) => (
          <StatsCard
            key={stat.name}
            name={stat.name}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Cashier Performance Section - Only for Admin */}
      {isAdmin && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Cashier Performance
              </h2>
              <p className="text-slate-600">
                Sales and revenue performance by cashier
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={cashierTimeFilter}
                  onChange={(e) => setCashierTimeFilter(e.target.value)}
                  disabled={cashierStatsLoading}
                  className={`appearance-none px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[var(--framer-color-tint)] focus:border-transparent text-sm font-medium transition-colors cursor-pointer min-w-[140px] ${
                    cashierStatsLoading
                      ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {cashierStatsLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                  ) : (
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {cashierStatsLoading ? (
              // Loading skeleton for cashier cards
              <>
                <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-pulse">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-gray-200 rounded-2xl mr-4"></div>
                      <div>
                        <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center p-4 bg-gray-100 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-32 mb-3"></div>
                      <div className="flex justify-between items-center p-4 bg-gray-100 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-100 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-5">
                      <div className="flex justify-between items-center p-5 bg-gray-100 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-pulse">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-gray-200 rounded-2xl mr-4"></div>
                      <div>
                        <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center p-4 bg-gray-100 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-32 mb-3"></div>
                      <div className="flex justify-between items-center p-4 bg-gray-100 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-100 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-5">
                      <div className="flex justify-between items-center p-5 bg-gray-100 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              Object.entries(cashierStats).map(([cashierId, data]) => (
                <div
                  key={cashierId}
                  className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                >
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                        <span className="text-xl font-bold text-white">
                          {data.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {data.name}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">
                          Cashier
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Section */}
                  <div className="space-y-5">
                    {/* Total Sales */}
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          Total Sales
                        </span>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        {data.totalSales}
                      </span>
                    </div>

                    {/* Payment Methods Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Payment Breakdown
                      </h4>

                      {/* Cash */}
                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center mr-3">
                            <svg
                              className="w-4 h-4 text-green-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            Cash
                          </span>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          Rp {data.totalCash.toLocaleString()}
                        </span>
                      </div>

                      {/* Debit */}
                      <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center mr-3">
                            <svg
                              className="w-4 h-4 text-purple-700"
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
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            Debit
                          </span>
                        </div>
                        <span className="text-lg font-bold text-purple-600">
                          Rp {data.totalDebit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Total Revenue - Separated with visual divider */}
                    <div className="border-t border-gray-200 pt-5">
                      <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center mr-3">
                            <CurrencyDollarIcon className="w-4 h-4 text-blue-700" />
                          </div>
                          <span className="text-sm font-bold text-gray-800">
                            Total Revenue
                          </span>
                        </div>
                        <span className="text-xl font-bold text-blue-700">
                          Rp {data.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!cashierStatsLoading && Object.keys(cashierStats).length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No cashier data available
              </h3>
              <p className="text-gray-600">
                No sales data found for the selected time period
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sales by Category */}
      <div className="mb-8">
        <SalesByCategory
          timeFilter={categoryTimeFilter}
          onTimeFilterChange={setCategoryTimeFilter}
          isAdmin={isAdmin}
        />
      </div>

      {/* Recent Sales */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {isAdmin ? "Recent Sales" : "My Recent Sales"}
        </h2>
        <p className="text-slate-600 mb-4">
          {isAdmin
            ? "Overview of all recent sales transactions"
            : "Your recent sales transactions and performance"}
        </p>
      </div>

      <RecentSalesTable
        recentSales={recentSales}
        filteredSales={filteredSales}
        allUsers={allUsers}
        allCategories={allCategories}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cashierFilter={cashierFilter}
        setCashierFilter={setCashierFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        amountFilter={amountFilter}
        setAmountFilter={setAmountFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        onClearFilters={clearFilters}
        onSaleClick={fetchSaleDetails}
        loadingSaleId={loadingSaleId}
        isAdmin={isAdmin}
      />

      {/* Slide-out Drawer */}
      <LazyWrapper>
        <SaleDetailsDrawer
          isOpen={isDrawerOpen}
          isLoading={drawerLoading}
          selectedSale={selectedSale}
          onClose={closeDrawer}
        />
      </LazyWrapper>
    </div>
  );
}
