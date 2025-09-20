import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get date range (default to last 30 days if not provided)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get sales data
    const { data: sales, error: salesError } = await supabase
      .from("penjualan")
      .select(
        `
        *,
        penjualan_detail (
          id_kategori,
          jumlah,
          subtotal,
          kategori (
            nama_kategori
          )
        ),
        users (
          name
        )
      `
      )
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false });

    if (salesError) {
      throw salesError;
    }

    // Calculate summary statistics
    const totalRevenue =
      sales?.reduce((sum, sale) => sum + sale.total_harga, 0) || 0;
    const totalTransactions = sales?.length || 0;
    const totalItems =
      sales?.reduce((sum, sale) => sum + sale.total_item, 0) || 0;
    const averageOrderValue =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate daily sales
    const dailySales =
      sales?.reduce((acc, sale) => {
        const date = new Date(sale.created_at).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, transactions: 0 };
        }
        acc[date].revenue += sale.total_harga;
        acc[date].transactions += 1;
        return acc;
      }, {} as Record<string, { date: string; revenue: number; transactions: number }>) ||
      {};

    // Calculate sales by category
    const categorySales =
      sales?.reduce((acc, sale) => {
        sale.penjualan_detail?.forEach((detail: any) => {
          const categoryName = detail.kategori?.nama_kategori || "Unknown";
          if (!acc[categoryName]) {
            acc[categoryName] = { revenue: 0, quantity: 0, transactions: 0 };
          }
          acc[categoryName].revenue += detail.subtotal;
          acc[categoryName].quantity += detail.jumlah;
          acc[categoryName].transactions += 1;
        });
        return acc;
      }, {} as Record<string, { revenue: number; quantity: number; transactions: number }>) ||
      {};

    // Calculate payment method breakdown
    const paymentMethods =
      sales?.reduce((acc, sale) => {
        const method = sale.payment_method;
        if (!acc[method]) {
          acc[method] = { count: 0, revenue: 0 };
        }
        acc[method].count += 1;
        acc[method].revenue += sale.total_harga;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>) || {};

    // Calculate top selling categories
    const topCategories = Object.entries(categorySales)
      .map(([name, data]) => ({
        name,
        revenue: (
          data as { revenue: number; quantity: number; transactions: number }
        ).revenue,
        quantity: (
          data as { revenue: number; quantity: number; transactions: number }
        ).quantity,
        transactions: (
          data as { revenue: number; quantity: number; transactions: number }
        ).transactions,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate recent sales (last 10)
    const recentSales =
      sales?.slice(0, 10).map((sale) => ({
        id: sale.id_penjualan,
        total: sale.total_harga,
        items: sale.total_item,
        date: sale.created_at,
        user: sale.users?.name || "Unknown",
        paymentMethod: sale.payment_method,
      })) || [];

    // Calculate growth metrics (compare with previous period)
    const previousStart = new Date(
      start.getTime() - (end.getTime() - start.getTime())
    );
    const { data: previousSales } = await supabase
      .from("penjualan")
      .select("total_harga, total_item")
      .gte("created_at", previousStart.toISOString())
      .lt("created_at", start.toISOString());

    const previousRevenue =
      previousSales?.reduce((sum, sale) => sum + sale.total_harga, 0) || 0;
    const previousTransactions = previousSales?.length || 0;
    const previousItems =
      previousSales?.reduce((sum, sale) => sum + sale.total_item, 0) || 0;

    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
    const transactionGrowth =
      previousTransactions > 0
        ? ((totalTransactions - previousTransactions) / previousTransactions) *
          100
        : 0;
    const itemGrowth =
      previousItems > 0
        ? ((totalItems - previousItems) / previousItems) * 100
        : 0;

    const summary = {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      overview: {
        totalRevenue,
        totalTransactions,
        totalItems,
        averageOrderValue,
        revenueGrowth,
        transactionGrowth,
        itemGrowth,
      },
      dailySales: Object.values(dailySales).sort(
        (a, b) =>
          new Date((a as { date: string }).date).getTime() -
          new Date((b as { date: string }).date).getTime()
      ),
      categorySales: Object.entries(categorySales).map(([name, data]) => ({
        name,
        revenue: (
          data as { revenue: number; quantity: number; transactions: number }
        ).revenue,
        quantity: (
          data as { revenue: number; quantity: number; transactions: number }
        ).quantity,
        transactions: (
          data as { revenue: number; quantity: number; transactions: number }
        ).transactions,
        percentage:
          totalRevenue > 0
            ? ((
                data as {
                  revenue: number;
                  quantity: number;
                  transactions: number;
                }
              ).revenue /
                totalRevenue) *
              100
            : 0,
      })),
      paymentMethods: Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        count: (data as { count: number; revenue: number }).count,
        revenue: (data as { count: number; revenue: number }).revenue,
        percentage:
          totalTransactions > 0
            ? ((data as { count: number; revenue: number }).count /
                totalTransactions) *
              100
            : 0,
      })),
      topCategories,
      recentSales,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales summary" },
      { status: 500 }
    );
  }
}
