import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const saleId = parseInt(resolvedParams.id);

    if (isNaN(saleId)) {
      return NextResponse.json({ error: "Invalid sale ID" }, { status: 400 });
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (only admins can delete sales)
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

    // Get sale details first to restore stock
    const { data: saleDetails, error: detailsError } = await supabase
      .from("penjualan_detail")
      .select("*")
      .eq("id_penjualan", saleId);

    if (detailsError) {
      console.error("Error fetching sale details:", detailsError);
      return NextResponse.json(
        { error: detailsError.message },
        { status: 400 }
      );
    }

    // Restore stock for each item
    if (saleDetails && saleDetails.length > 0) {
      for (const detail of saleDetails) {
        const { error: stockError } = await supabase.rpc(
          "increase_category_stock",
          {
            category_id: detail.id_kategori,
            quantity: detail.jumlah,
          }
        );

        if (stockError) {
          console.error("Error restoring stock:", stockError);
          // Continue with deletion even if stock restoration fails
        }
      }
    }

    // Delete sale details first (foreign key constraint)
    const { error: deleteDetailsError } = await supabase
      .from("penjualan_detail")
      .delete()
      .eq("id_penjualan", saleId);

    if (deleteDetailsError) {
      console.error("Error deleting sale details:", deleteDetailsError);
      return NextResponse.json(
        { error: deleteDetailsError.message },
        { status: 400 }
      );
    }

    // Delete the sale
    const { error: deleteSaleError } = await supabase
      .from("penjualan")
      .delete()
      .eq("id_penjualan", saleId);

    if (deleteSaleError) {
      console.error("Error deleting sale:", deleteSaleError);
      return NextResponse.json(
        { error: deleteSaleError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Delete sale error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const saleId = parseInt(resolvedParams.id);

    if (isNaN(saleId)) {
      return NextResponse.json({ error: "Invalid sale ID" }, { status: 400 });
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sale data
    const { data: sale, error: saleError } = await supabase
      .from("penjualan")
      .select("*")
      .eq("id_penjualan", saleId)
      .single();

    if (saleError) {
      console.error("Sale error:", saleError);
      return NextResponse.json({ error: saleError.message }, { status: 400 });
    }

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
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

    // Get sale details
    const { data: items, error: itemsError } = await supabase
      .from("penjualan_detail")
      .select(
        `
        *,
        kategori:kategori(nama_kategori)
      `
      )
      .eq("id_penjualan", saleId);

    if (itemsError) {
      console.error("Items error:", itemsError);
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    // Get settings
    const { data: setting } = await supabase
      .from("setting")
      .select("*")
      .single();

    const formattedItems =
      items?.map((item) => ({
        nama_kategori: item.kategori?.nama_kategori || "Unknown Category",
        harga_jual: item.harga_jual,
        jumlah: item.jumlah,
        subtotal: item.subtotal,
        diskon: item.diskon || 0,
        discount_type: item.discount_type || "amount",
      })) || [];

    const responseData = {
      ...sale,
      member: memberData,
      user: userData,
      items: formattedItems,
      setting: setting || {
        nama_perusahaan: "SVJ Outdoor",
        alamat: "",
        telepon: "",
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error in sales API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
