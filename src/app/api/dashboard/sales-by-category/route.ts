import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check level
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("level")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Error fetching user profile" },
        { status: 500 }
      );
    }

    const isAdmin = userProfile?.level === 1;

    // Get time filter from query params
    const { searchParams } = new URL(request.url);
    const timeFilter = searchParams.get("time") || "today";

    // Calculate date range based on filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate: Date;
    let endDate: Date;

    switch (timeFilter) {
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
      case "year":
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;
      default:
        startDate = new Date(0); // All time
        endDate = new Date();
    }

    // Build the query for sales by category
    let salesQuery = supabase.from("penjualan_detail").select(`
        id_kategori,
        subtotal,
        jumlah,
        penjualan!inner(
          id_penjualan,
          created_at,
          id_user
        ),
        kategori!inner(
          id_kategori,
          nama_kategori
        )
      `);

    // Apply date filter
    if (timeFilter !== "all") {
      salesQuery = salesQuery
        .gte("penjualan.created_at", startDate.toISOString())
        .lt("penjualan.created_at", endDate.toISOString());
    }

    // Apply user filter for cashiers
    if (!isAdmin) {
      salesQuery = salesQuery.eq("penjualan.id_user", user.id);
    }

    const { data: salesData, error: salesError } = await salesQuery;

    if (salesError) {
      console.error("Error fetching sales by category:", salesError);
      return NextResponse.json(
        { error: "Error fetching sales data" },
        { status: 500 }
      );
    }

    // Process and aggregate data by category
    const categoryStats: {
      [key: string]: {
        id_kategori: number;
        nama_kategori: string;
        total_sales: number;
        total_quantity: number;
        total_revenue: number;
        unique_sales: Set<number>; // Track unique sales for this category
      };
    } = {};

    salesData?.forEach((item: any) => {
      const categoryId = item.id_kategori;
      const categoryName = item.kategori?.nama_kategori || "Unknown";
      const saleId = item.penjualan?.id_penjualan;

      if (!categoryStats[categoryId]) {
        categoryStats[categoryId] = {
          id_kategori: categoryId,
          nama_kategori: categoryName,
          total_sales: 0,
          total_quantity: 0,
          total_revenue: 0,
          unique_sales: new Set(),
        };
      }

      // Add unique sale ID to track distinct sales
      if (saleId) {
        categoryStats[categoryId].unique_sales.add(saleId);
      }

      categoryStats[categoryId].total_quantity += item.jumlah || 0;
      categoryStats[categoryId].total_revenue += item.subtotal || 0;
    });

    // Convert unique sales sets to counts
    Object.values(categoryStats).forEach((category) => {
      category.total_sales = category.unique_sales.size;
      delete category.unique_sales; // Remove the Set from final data
    });

    // Convert to array and sort by revenue
    const categoryStatsArray = Object.values(categoryStats).sort(
      (a, b) => b.total_revenue - a.total_revenue
    );

    // Data validation: Check if sales data is consistent
    if (timeFilter !== "all") {
      // Get total sales count from penjualan table for validation
      let validationQuery = supabase
        .from("penjualan")
        .select("id_penjualan, total_harga")
        .gte("created_at", startDate.toISOString())
        .lt("created_at", endDate.toISOString());

      if (!isAdmin) {
        validationQuery = validationQuery.eq("id_user", user.id);
      }

      const { data: validationData } = await validationQuery;

      // Calculate total revenue from penjualan table
      const totalRevenueFromSales =
        validationData?.reduce((sum, sale) => sum + sale.total_harga, 0) || 0;

      // Calculate total revenue from category stats
      const totalRevenueFromCategories = categoryStatsArray.reduce(
        (sum, category) => sum + category.total_revenue,
        0
      );

      // Log discrepancy if found (for debugging)
      if (Math.abs(totalRevenueFromSales - totalRevenueFromCategories) > 1) {
        console.warn(
          `Revenue discrepancy detected: Sales table: ${totalRevenueFromSales}, Categories: ${totalRevenueFromCategories}`
        );
      }
    }

    return NextResponse.json({
      data: categoryStatsArray,
      timeFilter,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in sales by category API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
