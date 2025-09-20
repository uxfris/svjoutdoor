"use client";

import { createClient } from "@/lib/supabase/client";
import { useDataCache } from "@/hooks/useDataCache";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { LazyWrapper } from "@/components/ui/LazyWrapper";
import {
  CubeIcon,
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
  const [allUsers, setAllUsers] = useState<
    { id: string; name: string; level: number }[]
  >([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalMembers: 0,
    // Cashier-specific stats
    todaySales: 0,
    todayRevenue: 0,
    myTotalSales: 0,
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

  // Cache hooks
  const { fetchData: fetchDashboardStats } = useDataCache(
    "dashboard-stats",
    async () => {
      const supabase = createClient();

      if (isAdmin) {
        // Admin stats - business overview
        const [productsResult, salesResult, membersResult] = await Promise.all([
          supabase.from("produk").select("*", { count: "exact", head: true }),
          supabase
            .from("penjualan")
            .select("*", { count: "exact", head: true }),
          supabase.from("member").select("*", { count: "exact", head: true }),
        ]);

        return {
          totalProducts: productsResult.count || 0,
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

        const [productsResult, todaySalesResult, mySalesResult] =
          await Promise.all([
            supabase.from("produk").select("*", { count: "exact", head: true }),
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
          totalProducts: productsResult.count || 0,
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
    "recent-sales",
    async () => {
      const supabase = createClient();

      // For cashiers, only show their own sales
      // For admins, show all sales
      const query = supabase
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
        .limit(20);

      // Apply user filter for cashiers
      if (!isAdmin && user) {
        query.eq("id_user", user.id);
      }

      const { data: recentSalesData } = await query;
      return recentSalesData || [];
    },
    { ttl: 30 * 1000 } // 30 seconds cache
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

    return filtered;
  }, [recentSales, searchTerm, cashierFilter, dateFilter, amountFilter]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = useCallback(async () => {
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

      // Fetch data using cache
      const [statsData, recentSalesData, usersData] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentSales(),
        supabase.from("users").select("id, name, level"),
      ]);

      setStats(statsData);
      setAllUsers(usersData.data || []);

      // Map users to sales
      if (recentSalesData) {
        const salesWithUsers = recentSalesData.map((sale) => ({
          ...sale,
          users:
            usersData.data?.find((user) => user.id === sale.id_user) || null,
        }));
        setRecentSales(salesWithUsers);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardStats, fetchRecentSales]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setCashierFilter("all");
    setDateFilter("all");
    setAmountFilter("all");
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
        items?.map((item: any) => ({
          id_produk: item.id_produk,
          nama_produk: item.produk?.nama_produk || "Unknown Product",
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
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedSale(null);
    setDrawerLoading(false);
    setLoadingSaleId(null);
  }, []);

  const statsArray = useMemo(() => {
    if (isAdmin) {
      // Admin dashboard - business overview
      return [
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
        {
          name: "Total Members",
          value: stats.totalMembers,
          icon: UserGroupIcon,
          color: "bg-[var(--framer-color-tint)]",
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
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
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
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cashierFilter={cashierFilter}
        setCashierFilter={setCashierFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        amountFilter={amountFilter}
        setAmountFilter={setAmountFilter}
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
