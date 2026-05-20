"use client";

import { createClient } from "@/lib/supabase/client";
import { useDataCache } from "@/hooks/useDataCache";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { SalesByCategory } from "@/components/dashboard/SalesByCategory";
import { LazyWrapper } from "@/components/ui/LazyWrapper";
import { DashboardPageSkeleton } from "@/components/ui/page-skeletons";
import { RecentSale } from "@/lib/database.types";
import { getNetSaleAmount } from "@/lib/discount";
import { PrintService, PrintReceiptData } from "@/lib/print-service";
import {
  presenceFromHeartbeat,
  ADMIN_PRESENCE_POLL_MS,
  type CashierPresence,
} from "@/lib/cashier-presence";
import {
  TagIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

// Lazy load the drawer component
const SaleDetailsDrawer = dynamic(
  () =>
    import("@/components/dashboard/SaleDetailsDrawer").then((mod) => ({
      default: mod.SaleDetailsDrawer,
    })),
  { ssr: false },
);

const CASHIER_TIME_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "all", label: "All time" },
];

function cashierPresenceBadgeClass(presence: CashierPresence) {
  switch (presence) {
    case "online":
      return "bg-[#6cf8bb] text-[#00714d]";
    case "active":
      return "bg-[#e6e8ea] text-[#434655]";
    default:
      return "bg-slate-200 text-slate-600";
  }
}

function cashierPresenceLabel(presence: CashierPresence) {
  switch (presence) {
    case "online":
      return "Online";
    case "active":
      return "Active";
    default:
      return "Offline";
  }
}

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
    // Payment method breakdown for today's revenue
    todayCash: 0,
    todayDebit: 0,
  });

  // Cashier performance stats for admin
  const [cashierStats, setCashierStats] = useState<{
    [cashierId: string]: {
      name: string;
      totalSales: number;
      totalRevenue: number;
      totalCash: number;
      totalDebit: number;
      presence: CashierPresence;
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

  // Print states
  const [printingSaleId, setPrintingSaleId] = useState<number | null>(null);
  const [settings, setSettings] = useState<{
    nama_perusahaan: string;
    alamat: string;
    telepon: string;
    receipt_width_mm?: number;
    receipt_font_size?: number;
    receipt_paper_type?: string;
    receipt_footer?: string;
  }>({
    nama_perusahaan: "SVJ OUTDOOR",
    alamat: "",
    telepon: "",
    receipt_width_mm: 75,
    receipt_font_size: 12,
    receipt_paper_type: "thermal_75mm",
    receipt_footer: "",
  });

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
          todayCash: 0,
          todayDebit: 0,
        };
      } else {
        // Cashier stats - personal performance
        const today = new Date();
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
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
              .select(
                "total_harga, diskon, discount_type, bayar, payment_method",
                { count: "exact" },
              )
              .eq("id_user", user?.id)
              .gte("created_at", todayStart.toISOString())
              .lt("created_at", todayEnd.toISOString()),
            supabase
              .from("penjualan")
              .select("total_harga, diskon, discount_type, bayar", {
                count: "exact",
              })
              .eq("id_user", user?.id),
          ]);

        const todayRevenue =
          todaySalesResult.data?.reduce(
            (sum, sale) => sum + getNetSaleAmount(sale),
            0,
          ) || 0;

        // Calculate payment method breakdown for today
        const todayCash =
          todaySalesResult.data?.reduce(
            (sum, sale) =>
              sum +
              (sale.payment_method === "cash" ? getNetSaleAmount(sale) : 0),
            0,
          ) || 0;

        const todayDebit =
          todaySalesResult.data?.reduce(
            (sum, sale) =>
              sum +
              (sale.payment_method === "debit" ? getNetSaleAmount(sale) : 0),
            0,
          ) || 0;

        return {
          totalCategories: categoriesResult.count || 0,
          totalSales: 0,
          totalMembers: 0,
          todaySales: todaySalesResult.count || 0,
          todayRevenue,
          myTotalSales: mySalesResult.count || 0,
          todayCash,
          todayDebit,
        };
      }
    },
    { ttl: 2 * 60 * 1000 }, // 2 minutes cache
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
            diskon,
            discount_type,
            bayar,
            created_at,
            id_user,
            penjualan_detail(
              id_kategori,
              kategori(nama_kategori)
            )
          `,
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
    { ttl: 30 * 1000 },
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
        .select(
          "id_user, total_harga, diskon, discount_type, bayar, payment_method, created_at",
        );

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
        .select("id, name, level, last_heartbeat_at")
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
          presence: CashierPresence;
        };
      } = {};

      usersData.forEach(
        (user: {
          id: string;
          name: string;
          level: number;
          last_heartbeat_at: string | null;
        }) => {
          const userSales = salesData.filter(
            (sale) => sale.id_user === user.id,
          );
          const cashSales = userSales.filter(
            (sale) => sale.payment_method === "cash",
          );
          const debitSales = userSales.filter(
            (sale) => sale.payment_method === "debit",
          );

          // Calculate totals
          const totalRevenue = userSales.reduce(
            (sum, sale) => sum + getNetSaleAmount(sale),
            0,
          );
          const totalCash = cashSales.reduce(
            (sum, sale) => sum + getNetSaleAmount(sale),
            0,
          );
          const totalDebit = debitSales.reduce(
            (sum, sale) => sum + getNetSaleAmount(sale),
            0,
          );

          // Validate data consistency (cash + debit should equal total revenue)
          const calculatedTotal = totalCash + totalDebit;
          if (Math.abs(totalRevenue - calculatedTotal) > 1) {
            console.warn(
              `Revenue mismatch for cashier ${user.name}: Total=${totalRevenue}, Cash+Debit=${calculatedTotal}`,
            );
          }

          stats[user.id] = {
            name: user.name,
            totalSales: userSales.length,
            totalRevenue,
            totalCash,
            totalDebit,
            presence: presenceFromHeartbeat(user.last_heartbeat_at),
          };
        },
      );

      return stats;
    },
    { ttl: 2 * 60 * 1000 }, // 2 minutes cache
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
          getNetSaleAmount(sale).toString().includes(searchTerm),
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

    // Amount filter (net amount after discount)
    if (amountFilter !== "all") {
      filtered = filtered.filter((sale) => {
        const netAmount = getNetSaleAmount(sale);
        switch (amountFilter) {
          case "low":
            return netAmount < 100000; // Less than 100k
          case "medium":
            return netAmount >= 100000 && netAmount < 500000; // 100k - 500k
          case "high":
            return netAmount >= 500000; // More than 500k
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
          (detail) => detail.id_kategori.toString() === categoryFilter,
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

  // Poll cashier heartbeats so admin sees Online / Active without waiting for stats cache TTL
  useEffect(() => {
    if (!isAdmin) return;

    const supabase = createClient();
    let cancelled = false;

    const pollPresence = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, last_heartbeat_at")
        .eq("level", 2);
      if (cancelled || error || !data?.length) return;

      setCashierStats((prev) => {
        if (Object.keys(prev).length === 0) return prev;
        const next = { ...prev };
        let changed = false;
        for (const row of data) {
          if (!next[row.id]) continue;
          const presence = presenceFromHeartbeat(row.last_heartbeat_at);
          if (next[row.id].presence !== presence) {
            next[row.id] = { ...next[row.id], presence };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };

    void pollPresence();
    const intervalId = window.setInterval(
      () => void pollPresence(),
      ADMIN_PRESENCE_POLL_MS,
    );
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAdmin]);

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
      const [statsData, usersData, categoriesData, settingsData] =
        await Promise.all([
          fetchDashboardStats(),
          supabase.from("users").select("id, name, level").eq("level", 2), // Only get cashiers
          supabase
            .from("kategori")
            .select("id_kategori, nama_kategori")
            .order("nama_kategori"),
          supabase
            .from("setting")
            .select(
              "nama_perusahaan, alamat, telepon, receipt_width_mm, receipt_font_size, receipt_paper_type, receipt_footer",
            )
            .single(),
        ]);

      setStats(statsData);
      setAllUsers(usersData.data || []);
      setAllCategories(categoriesData.data || []);

      // Update settings if available
      if (settingsData.data) {
        setSettings({
          nama_perusahaan: settingsData.data.nama_perusahaan || "SVJ OUTDOOR",
          alamat: settingsData.data.alamat || "",
          telepon: settingsData.data.telepon || "",
          receipt_width_mm: settingsData.data.receipt_width_mm || 75,
          receipt_font_size: settingsData.data.receipt_font_size || 12,
          receipt_paper_type:
            settingsData.data.receipt_paper_type || "thermal_75mm",
          receipt_footer: settingsData.data.receipt_footer || "",
        });
      }

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
        `,
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
        `,
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
  }, []);

  const handlePrintReceipt = useCallback(
    async (saleId: number) => {
      setPrintingSaleId(saleId);
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
          created_at,
          id_member,
          id_user
        `,
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
          .select("name")
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
        `,
          )
          .eq("id_penjualan", saleId);

        if (itemsError) {
          console.error("Error fetching sale items:", itemsError);
          return;
        }

        // Format items data
        const formattedItems =
          items?.map((item: any) => ({
            nama_kategori: item.kategori?.nama_kategori || "Unknown Category",
            harga_jual: item.harga_jual,
            jumlah: item.jumlah,
            diskon: item.diskon,
            discount_type: item.discount_type,
            subtotal: item.subtotal,
          })) || [];

        // Prepare print data
        const printData: PrintReceiptData = {
          id_penjualan: sale.id_penjualan,
          total_item: sale.total_item,
          total_harga: sale.total_harga,
          diskon: sale.diskon,
          discount_type: sale.discount_type,
          bayar: sale.bayar,
          diterima: sale.diterima,
          created_at: sale.created_at,
          member: memberData || undefined,
          user: userData || undefined,
          items: formattedItems,
          setting: settings,
        };

        // Print the receipt
        await PrintService.printSmallReceipt(printData);
      } catch (error) {
        console.error("Error printing receipt:", error);
      } finally {
        setPrintingSaleId(null);
      }
    },
    [settings],
  );

  const statsArray = useMemo(() => {
    if (isAdmin) {
      // Admin dashboard - business overview (hiding member card)
      return [
        {
          name: "Total Kategori",
          value: stats.totalCategories,
          icon: TagIcon,
          color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
          paymentBreakdown: undefined,
          isFullWidth: false,
        },
        {
          name: "Total Penjualan",
          value: stats.totalSales,
          icon: ArrowTrendingUpIcon,
          color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
          paymentBreakdown: undefined,
          isFullWidth: false,
        },
      ];
    } else {
      // Cashier dashboard - personal performance
      return [
        {
          name: "Pendapatan Hari Ini",
          value: `Rp ${stats.todayRevenue.toLocaleString()}`,
          icon: CurrencyDollarIcon,
          color: "bg-gradient-to-br from-blue-500 to-blue-600",
          paymentBreakdown: {
            cash: stats.todayCash,
            debit: stats.todayDebit,
          },
          isFullWidth: true,
        },
        {
          name: "Penjualan Hari Ini",
          value: stats.todaySales,
          icon: CurrencyDollarIcon,
          color: "bg-gradient-to-br from-green-500 to-green-600",
          paymentBreakdown: undefined,
          isFullWidth: false,
        },
        {
          name: "Total Penjualan Saya",
          value: stats.myTotalSales,
          icon: UserGroupIcon,
          color: "bg-gradient-to-br from-purple-500 to-purple-600",
          paymentBreakdown: undefined,
          isFullWidth: false,
        },
      ];
    }
  }, [stats, isAdmin]);

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  if (!user) {
    return <div>Silakan masuk untuk melihat dashboard.</div>;
  }

  return (
    <div className="p-8 bg-[#F7F9FB]">
      {/* Welcome Section + admin hero stats */}
      <div className="mb-12">
        {isAdmin ? (
          <div className="relative overflow-hidden rounded-2xl bg-[#2563eb] px-6 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:px-7 md:py-10">
            <div className="absolute -right-80 opacity-20">
              <Image
                src="/welcome-background.png"
                alt={""}
                width={600}
                height={600}
              />
            </div>
            <div className="relative z-10 flex flex-col gap-5 md:gap-12">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Selamat datang kembali!
                </h1>
                <p className="text-sm font-medium text-[#b4c5ff] md:text-base">
                  Inilah yang terjadi dengan bisnis Anda hari ini.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
                {statsArray.map((stat) => (
                  <StatsCard
                    key={stat.name}
                    variant="adminHero"
                    name={stat.name}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    paymentBreakdown={stat.paymentBreakdown}
                    isFullWidth={stat.isFullWidth}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-[#2563eb] px-6 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:px-7 md:py-10">
            <div className="absolute -right-80 opacity-20">
              <Image
                src="/welcome-background.png"
                alt=""
                width={600}
                height={600}
              />
            </div>
            <div className="relative z-10 flex flex-col gap-5 md:gap-12">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Selamat siang!
                </h1>
                <p className="text-sm font-medium text-[#b4c5ff] md:text-base">
                  Inilah performa penjualan dan transaksi terbaru Anda.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:gap-4">
                <StatsCard
                  key={statsArray[0].name}
                  variant="adminHero"
                  name={statsArray[0].name}
                  value={statsArray[0].value}
                  icon={statsArray[0].icon}
                  color={statsArray[0].color}
                  paymentBreakdown={statsArray[0].paymentBreakdown}
                  isFullWidth={statsArray[0].isFullWidth}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
                  {statsArray.slice(1).map((stat) => (
                    <StatsCard
                      key={stat.name}
                      variant="adminHero"
                      name={stat.name}
                      value={stat.value}
                      icon={stat.icon}
                      color={stat.color}
                      paymentBreakdown={stat.paymentBreakdown}
                      isFullWidth={stat.isFullWidth}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cashier Performance Section - Only for Admin */}
      {isAdmin && (
        <div className="mb-12 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-[#191c1e] md:text-2xl">
                Performa Kasir
              </h2>
              <p className="text-sm text-[#434655] md:text-base">
                Pemantauan transaksi real-time per toko.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1 self-stretch rounded-md bg-[#f2f4f6] p-1 sm:self-auto sm:justify-end">
              {CASHIER_TIME_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={cashierStatsLoading}
                  onClick={() => setCashierTimeFilter(opt.value)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm ${
                    cashierTimeFilter === opt.value
                      ? "bg-white text-[#004ac6] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                      : "text-[#434655] hover:text-slate-900"
                  } ${
                    cashierStatsLoading
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {cashierStatsLoading ? (
                <span
                  className="ml-1 inline-flex items-center px-1"
                  aria-hidden
                >
                  <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#004ac6]" />
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {cashierStatsLoading ? (
              <>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl bg-white p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  >
                    <div className="animate-pulse space-y-4 rounded-[11px] bg-[#f2f4f6] p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-1 items-start gap-3">
                          <div className="size-10 rounded-lg bg-slate-300/80" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-4 w-28 rounded bg-slate-300/80" />
                            <div className="h-3 w-16 rounded bg-slate-300/60" />
                          </div>
                        </div>
                        <div className="h-6 w-14 shrink-0 rounded-md bg-slate-300/70" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-20 rounded-lg bg-white shadow-sm" />
                        <div className="h-20 rounded-lg bg-slate-300/40" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-32 rounded bg-slate-300/60" />
                        <div className="h-11 rounded-md bg-white" />
                        <div className="h-11 rounded-md bg-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              Object.entries(cashierStats).map(([cashierId, data], index) => (
                <div
                  key={cashierId}
                  className="overflow-hidden rounded-4xl p-0.5 border-4 border-white"
                >
                  <div className="flex flex-col gap-4 rounded-[11px] bg-[#f2f4f6] p-4 md:gap-5 md:p-8">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className={`relative flex size-10 shrink-0 items-center justify-center rounded-lg shadow-md ${
                            index % 2 === 0
                              ? "bg-gradient-to-br from-emerald-900 to-emerald-300"
                              : "bg-gradient-to-br from-indigo-800 to-indigo-400"
                          }`}
                        >
                          <BuildingStorefrontIcon
                            className="size-5 text-white"
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-[#191c1e] md:text-lg">
                            {data.name}
                          </h3>
                          <p className="text-xs font-medium text-[#434655] md:text-sm">
                            Kasir
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide md:text-sm ${cashierPresenceBadgeClass(data.presence)}`}
                      >
                        {cashierPresenceLabel(data.presence)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <div className="flex flex-col gap-0.5 rounded-xl bg-white px-6 pt-4 pb-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#434655] md:text-xs">
                          Total Penjualan
                        </span>
                        <span className="text-xl font-extrabold text-[#191c1e] md:text-2xl">
                          {data.totalSales}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 rounded-xl border border-[rgba(0,74,198,0.08)] bg-[rgba(0,74,198,0.05)] px-6 pt-4 pb-6">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#004ac6] md:text-xs">
                          Pendapatan Total
                        </span>
                        <span className="text-base font-extrabold leading-tight text-[#004ac6] md:text-2xl">
                          Rp {data.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                        Rincian Pembayaran
                      </p>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between rounded-xl border border-white bg-white p-6">
                          <div className="flex items-center gap-2">
                            <BanknotesIcon
                              className="size-5 shrink-0 text-[#191c1e]"
                              aria-hidden
                            />
                            <span className="text-sm font-semibold text-[#191c1e]">
                              Tunai
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-[#191c1e]">
                            Rp {data.totalCash.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-white bg-white p-6">
                          <div className="flex items-center gap-2">
                            <CreditCardIcon
                              className="size-5 shrink-0 text-[#191c1e]"
                              aria-hidden
                            />
                            <span className="text-sm font-semibold text-[#191c1e]">
                              Debit
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-[#191c1e]">
                            Rp {data.totalDebit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!cashierStatsLoading && Object.keys(cashierStats).length === 0 && (
            <div className="rounded-xl bg-[#f2f4f6] py-12 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-sm">
                <UserGroupIcon className="size-8 text-slate-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#191c1e]">
                Tidak ada data kasir tersedia
              </h3>
              <p className="text-[#434655]">
                Tidak ada data penjualan ditemukan untuk periode waktu yang
                dipilih
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sales by Category - Only for Admin */}
      {isAdmin && (
        <div className="mb-8">
          <SalesByCategory
            timeFilter={categoryTimeFilter}
            onTimeFilterChange={setCategoryTimeFilter}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* Recent Sales */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {isAdmin ? "Penjualan Terbaru" : "Penjualan Terbaru Saya"}
        </h2>
        <p className="text-slate-600 mb-4">
          {isAdmin
            ? "Ringkasan semua transaksi penjualan terbaru"
            : "Transaksi penjualan terbaru dan performa Anda"}
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
        onPrintReceipt={handlePrintReceipt}
        printingSaleId={printingSaleId}
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
