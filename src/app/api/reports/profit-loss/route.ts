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
        total_harga,
        diskon,
        discount_type,
        created_at
      `
      )
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    if (salesError) {
      throw salesError;
    }

    // Get sales details for cost calculation
    const { data: salesDetails, error: salesDetailsError } = await supabase
      .from("penjualan_detail")
      .select(
        `
        id_kategori,
        harga_jual,
        jumlah,
        subtotal,
        penjualan!inner (
          created_at
        )
      `
      )
      .gte("penjualan.created_at", start.toISOString())
      .lte("penjualan.created_at", end.toISOString());

    if (salesDetailsError) {
      throw salesDetailsError;
    }

    // Get purchase data for cost of goods sold calculation
    const { data: purchases, error: purchasesError } = await supabase
      .from("pembelian_detail")
      .select(
        `
        id_kategori,
        harga_beli,
        jumlah,
        subtotal,
        pembelian!inner (
          created_at
        )
      `
      )
      .gte("pembelian.created_at", start.toISOString())
      .lte("pembelian.created_at", end.toISOString());

    if (purchasesError) {
      throw purchasesError;
    }

    // Get expenses
    const { data: expenses, error: expensesError } = await supabase
      .from("pengeluaran")
      .select("*")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    if (expensesError) {
      throw expensesError;
    }

    // Calculate revenue
    const totalRevenue =
      sales?.reduce((sum, sale) => sum + sale.total_harga, 0) || 0;
    const totalDiscounts =
      sales?.reduce((sum, sale) => sum + (sale.diskon || 0), 0) || 0;
    const netRevenue = totalRevenue - totalDiscounts;

    // Calculate cost of goods sold (COGS)
    // This is a simplified calculation - in reality, you'd need to track inventory more precisely
    const categoryCosts = new Map<number, number>();

    // Calculate average cost per category from purchases
    purchases?.forEach((purchase) => {
      const categoryId = purchase.id_kategori;
      const currentCost = categoryCosts.get(categoryId) || 0;
      const newCost = currentCost + purchase.subtotal;
      categoryCosts.set(categoryId, newCost);
    });

    // Calculate COGS based on sales
    let totalCOGS = 0;
    salesDetails?.forEach((sale) => {
      const categoryId = sale.id_kategori;
      const categoryCost = categoryCosts.get(categoryId) || 0;
      // This is a simplified calculation - you'd need proper inventory tracking
      const estimatedCOGS = sale.subtotal * 0.6; // Assuming 60% cost ratio
      totalCOGS += estimatedCOGS;
    });

    // Calculate gross profit
    const grossProfit = netRevenue - totalCOGS;
    const grossProfitMargin =
      netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    // Calculate total expenses
    const totalExpenses =
      expenses?.reduce((sum, expense) => sum + expense.nominal, 0) || 0;

    // Calculate operating profit
    const operatingProfit = grossProfit - totalExpenses;
    const operatingProfitMargin =
      netRevenue > 0 ? (operatingProfit / netRevenue) * 100 : 0;

    // Calculate net profit
    const netProfit = operatingProfit; // Assuming no other income/expenses
    const netProfitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    // Calculate daily profit/loss
    const dailyPL =
      sales?.reduce((acc, sale) => {
        const date = new Date(sale.created_at).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, expenses: 0, profit: 0 };
        }
        acc[date].revenue += sale.total_harga - (sale.diskon || 0);
        return acc;
      }, {} as Record<string, { date: string; revenue: number; expenses: number; profit: number }>) ||
      {};

    // Add expenses to daily data
    expenses?.forEach((expense) => {
      const date = new Date(expense.created_at).toISOString().split("T")[0];
      if (dailyPL[date]) {
        dailyPL[date].expenses += expense.nominal;
      } else {
        dailyPL[date] = {
          date,
          revenue: 0,
          expenses: expense.nominal,
          profit: 0,
        };
      }
    });

    // Calculate daily profit
    Object.values(dailyPL).forEach((day) => {
      day.profit = day.revenue - day.expenses;
    });

    // Calculate expense breakdown
    const expenseBreakdown =
      expenses?.reduce((acc, expense) => {
        const category = expense.deskripsi.split(" ")[0]; // Simple categorization
        if (!acc[category]) {
          acc[category] = { amount: 0, count: 0 };
        }
        acc[category].amount += expense.nominal;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>) || {};

    // Calculate revenue by category
    const revenueByCategory =
      salesDetails?.reduce((acc, detail) => {
        const categoryId = detail.id_kategori;
        if (!acc[categoryId]) {
          acc[categoryId] = { revenue: 0, quantity: 0 };
        }
        acc[categoryId].revenue += detail.subtotal;
        acc[categoryId].quantity += detail.jumlah;
        return acc;
      }, {} as Record<number, { revenue: number; quantity: number }>) || {};

    // Get category names
    const { data: categories } = await supabase
      .from("kategori")
      .select("id_kategori, nama_kategori")
      .in("id_kategori", Object.keys(revenueByCategory).map(Number));

    const revenueByCategoryWithNames = Object.entries(revenueByCategory)
      .map(([categoryId, data]) => {
        const category = categories?.find(
          (c) => c.id_kategori === parseInt(categoryId)
        );
        return {
          categoryId: parseInt(categoryId),
          categoryName: category?.nama_kategori || "Unknown",
          revenue: data.revenue,
          quantity: data.quantity,
          percentage: netRevenue > 0 ? (data.revenue / netRevenue) * 100 : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate previous period for comparison
    const previousStart = new Date(
      start.getTime() - (end.getTime() - start.getTime())
    );
    const { data: previousSales } = await supabase
      .from("penjualan")
      .select("total_harga, diskon")
      .gte("created_at", previousStart.toISOString())
      .lt("created_at", start.toISOString());

    const { data: previousExpenses } = await supabase
      .from("pengeluaran")
      .select("nominal")
      .gte("created_at", previousStart.toISOString())
      .lt("created_at", start.toISOString());

    const previousRevenue =
      previousSales?.reduce(
        (sum, sale) => sum + sale.total_harga - (sale.diskon || 0),
        0
      ) || 0;
    const previousTotalExpenses =
      previousExpenses?.reduce((sum, expense) => sum + expense.nominal, 0) || 0;
    const previousProfit = previousRevenue - previousTotalExpenses;

    const revenueGrowth =
      previousRevenue > 0
        ? ((netRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
    const profitGrowth =
      previousProfit !== 0
        ? ((netProfit - previousProfit) / Math.abs(previousProfit)) * 100
        : 0;

    const summary = {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      income: {
        totalRevenue,
        totalDiscounts,
        netRevenue,
        revenueGrowth,
      },
      costs: {
        costOfGoodsSold: totalCOGS,
        grossProfit,
        grossProfitMargin,
      },
      expenses: {
        totalExpenses,
        breakdown: Object.entries(expenseBreakdown).map(
          ([category, data]: [string, any]) => ({
            category,
            amount: data.amount,
            count: data.count,
            percentage:
              totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
          })
        ),
      },
      profit: {
        operatingProfit,
        operatingProfitMargin,
        netProfit,
        netProfitMargin,
        profitGrowth,
      },
      dailyPL: Object.values(dailyPL).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      revenueByCategory: revenueByCategoryWithNames,
      summary: {
        totalTransactions: sales?.length || 0,
        averageTransactionValue: sales?.length ? netRevenue / sales.length : 0,
        expenseRatio: netRevenue > 0 ? (totalExpenses / netRevenue) * 100 : 0,
        profitRatio: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
      },
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching profit & loss:", error);
    return NextResponse.json(
      { error: "Failed to fetch profit & loss data" },
      { status: 500 }
    );
  }
}
