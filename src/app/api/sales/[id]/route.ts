import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
        produk:produk(nama_produk)
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
        nama_produk: item.produk?.nama_produk || "Unknown Product",
        harga_jual: item.harga_jual,
        jumlah: item.jumlah,
        subtotal: item.subtotal,
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
