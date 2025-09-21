import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("level")
      .eq("id", user.id)
      .single();

    if (userError || !userData || userData.level !== 1) {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    // Use service client for admin operations
    const serviceClient = createServiceClient();

    // Start transaction-like operations
    try {
      // Clear detail tables first (in reverse dependency order)
      await serviceClient
        .from("penjualan_detail")
        .delete()
        .neq("id_penjualan_detail", 0);
      await serviceClient
        .from("pembelian_detail")
        .delete()
        .neq("id_pembelian_detail", 0);

      // Clear main transaction tables
      await serviceClient.from("penjualan").delete().neq("id_penjualan", 0);
      await serviceClient.from("pembelian").delete().neq("id_pembelian", 0);

      // Clear reference data tables
      await serviceClient.from("pengeluaran").delete().neq("id_pengeluaran", 0);
      await serviceClient.from("member").delete().neq("id_member", 0);
      await serviceClient.from("supplier").delete().neq("id_supplier", 0);
      await serviceClient.from("kategori").delete().neq("id_kategori", 0);

      // Clear settings (but keep one default record)
      await serviceClient.from("setting").delete().gt("id_setting", 1);

      // Clear users table (but keep at least one admin user for login)
      // Only delete users if there are more than 1, keep the first admin
      const { data: adminUsers } = await serviceClient
        .from("users")
        .select("id")
        .eq("level", 1)
        .order("created_at", { ascending: true })
        .limit(1);

      if (adminUsers && adminUsers.length > 0) {
        await serviceClient
          .from("users")
          .delete()
          .not("id", "in", `(${adminUsers[0].id})`);
      }

      // Insert default settings if none exist
      await serviceClient.from("setting").upsert({
        id_setting: 1,
        nama_perusahaan: "SVJ Outdoor",
        alamat: "Jl. Contoh Alamat No. 123",
        telepon: "08123456789",
        diskon: 0,
        updated_at: new Date().toISOString(),
      });

      // Update timestamps for remaining admin user
      await serviceClient
        .from("users")
        .update({ updated_at: new Date().toISOString() })
        .eq("level", 1);

      return NextResponse.json({
        success: true,
        message: "All data has been successfully reset. Admin user preserved.",
      });
    } catch (dbError) {
      console.error("Database reset error:", dbError);
      return NextResponse.json(
        { error: "Failed to reset data. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Reset data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
