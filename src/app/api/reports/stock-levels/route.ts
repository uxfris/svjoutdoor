import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get all categories with their stock levels
    const { data: categories, error: categoriesError } = await supabase
      .from("kategori")
      .select("*")
      .order("nama_kategori");

    if (categoriesError) {
      throw categoriesError;
    }

    // Get recent purchase data for each category
    const { data: purchases, error: purchasesError } = await supabase
      .from("pembelian_detail")
      .select(
        `
        id_kategori,
        jumlah,
        harga_beli,
        subtotal,
        created_at,
        pembelian (
          id_supplier,
          supplier (
            nama
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (purchasesError) {
      throw purchasesError;
    }

    // Get recent sales data for each category
    const { data: sales, error: salesError } = await supabase
      .from("penjualan_detail")
      .select(
        `
        id_kategori,
        jumlah,
        harga_jual,
        subtotal,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (salesError) {
      throw salesError;
    }

    // Calculate stock analysis for each category
    const stockAnalysis =
      categories?.map((category) => {
        const categoryPurchases =
          purchases?.filter((p) => p.id_kategori === category.id_kategori) ||
          [];
        const categorySales =
          sales?.filter((s) => s.id_kategori === category.id_kategori) || [];

        // Calculate total purchased and sold
        const totalPurchased = categoryPurchases.reduce(
          (sum, p) => sum + p.jumlah,
          0
        );
        const totalSold = categorySales.reduce((sum, s) => sum + s.jumlah, 0);

        // Calculate current stock (assuming initial stock + purchases - sales)
        const currentStock = category.stok;

        // Calculate stock value
        const stockValue = currentStock * category.harga_jual;

        // Calculate average purchase price
        const totalPurchaseValue = categoryPurchases.reduce(
          (sum, p) => sum + p.subtotal,
          0
        );
        const averagePurchasePrice =
          totalPurchased > 0 ? totalPurchaseValue / totalPurchased : 0;

        // Calculate turnover rate (sales / average stock)
        const averageStock = (totalPurchased + currentStock) / 2;
        const turnoverRate =
          averageStock > 0 ? (totalSold / averageStock) * 100 : 0;

        // Determine stock status
        let stockStatus = "good";
        if (currentStock <= 5) {
          stockStatus = "critical";
        } else if (currentStock <= 20) {
          stockStatus = "low";
        } else if (currentStock >= 100) {
          stockStatus = "high";
        }

        // Get last purchase date
        const lastPurchase = categoryPurchases[0];
        const lastPurchaseDate = lastPurchase
          ? new Date(lastPurchase.created_at)
          : null;

        // Get last sale date
        const lastSale = categorySales[0];
        const lastSaleDate = lastSale ? new Date(lastSale.created_at) : null;

        return {
          id: category.id_kategori,
          name: category.nama_kategori,
          code: category.kode_kategori,
          currentStock,
          stockValue,
          sellingPrice: category.harga_jual,
          averagePurchasePrice,
          totalPurchased,
          totalSold,
          turnoverRate,
          stockStatus,
          lastPurchaseDate,
          lastSaleDate,
          lastPurchaseSupplier:
            lastPurchase?.pembelian?.[0]?.supplier?.[0]?.nama || null,
          created_at: category.created_at,
          updated_at: category.updated_at,
        };
      }) || [];

    // Calculate summary statistics
    const totalCategories = stockAnalysis.length;
    const totalStockValue = stockAnalysis.reduce(
      (sum, item) => sum + item.stockValue,
      0
    );
    const criticalStock = stockAnalysis.filter(
      (item) => item.stockStatus === "critical"
    ).length;
    const lowStock = stockAnalysis.filter(
      (item) => item.stockStatus === "low"
    ).length;
    const highStock = stockAnalysis.filter(
      (item) => item.stockStatus === "high"
    ).length;
    const goodStock = stockAnalysis.filter(
      (item) => item.stockStatus === "good"
    ).length;

    // Sort by different criteria
    const byStockValue = [...stockAnalysis].sort(
      (a, b) => b.stockValue - a.stockValue
    );
    const byTurnoverRate = [...stockAnalysis].sort(
      (a, b) => b.turnoverRate - a.turnoverRate
    );
    const byStockLevel = [...stockAnalysis].sort(
      (a, b) => a.currentStock - b.currentStock
    );

    // Get slow-moving items (low turnover rate)
    const slowMovingItems = stockAnalysis
      .filter((item) => item.turnoverRate < 10 && item.currentStock > 0)
      .sort((a, b) => a.turnoverRate - b.turnoverRate);

    // Get fast-moving items (high turnover rate)
    const fastMovingItems = stockAnalysis
      .filter((item) => item.turnoverRate > 50)
      .sort((a, b) => b.turnoverRate - a.turnoverRate);

    const summary = {
      overview: {
        totalCategories,
        totalStockValue,
        criticalStock,
        lowStock,
        highStock,
        goodStock,
      },
      stockAnalysis,
      topByValue: byStockValue.slice(0, 10),
      topByTurnover: byTurnoverRate.slice(0, 10),
      lowStockItems: byStockLevel.slice(0, 10),
      slowMovingItems: slowMovingItems.slice(0, 10),
      fastMovingItems: fastMovingItems.slice(0, 10),
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching stock levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock levels" },
      { status: 500 }
    );
  }
}
