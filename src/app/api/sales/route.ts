import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      cart,
      memberId,
      total,
      discount = 0,
      discountType = "percentage",
      payment,
    } = body;
    const paymentMethod = payment?.method || "cash";

    console.log("Sales API - Request body:", body);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log("Sales API - No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Sales API - User:", user.id);
    console.log("Sales API - User email:", user.email);

    // Let's also check if the user exists in our users table
    const { data: userProfile, error: userProfileError } = await supabase
      .from("users")
      .select("name, level")
      .eq("id", user.id)
      .single();

    console.log("Sales API - User profile:", userProfile);
    console.log("Sales API - User profile error:", userProfileError);

    // Create sale transaction
    const { data: sale, error: saleError } = await supabase
      .from("penjualan")
      .insert({
        id_member: memberId || null,
        total_item: cart.reduce(
          (sum: number, item: any) => sum + item.jumlah,
          0
        ),
        total_harga: total,
        diskon: discount,
        discount_type: discountType,
        bayar: payment.amount,
        diterima: payment.received,
        payment_method: paymentMethod,
        id_user: user.id,
      })
      .select()
      .single();

    if (saleError) {
      console.log("Sales API - Sale creation error:", saleError);
      return NextResponse.json({ error: saleError.message }, { status: 400 });
    }

    console.log("Sales API - Sale created:", sale);

    // Create sale details
    const saleDetails = cart.map((item: any) => ({
      id_penjualan: sale.id_penjualan,
      id_kategori: item.id_kategori,
      harga_jual: item.harga_jual,
      jumlah: item.jumlah,
      subtotal: item.subtotal,
    }));

    const { error: detailsError } = await supabase
      .from("penjualan_detail")
      .insert(saleDetails);

    if (detailsError) {
      console.log("Sales API - Details creation error:", detailsError);
      // Rollback sale if details creation fails
      await supabase
        .from("penjualan")
        .delete()
        .eq("id_penjualan", sale.id_penjualan);
      return NextResponse.json(
        { error: detailsError.message },
        { status: 400 }
      );
    }

    console.log("Sales API - Sale details created successfully");

    // Update category stock
    for (const item of cart) {
      const { error: stockError } = await supabase.rpc(
        "decrease_category_stock",
        {
          category_id: item.id_kategori,
          quantity: item.jumlah,
        }
      );

      if (stockError) {
        console.error("Error updating stock:", stockError);
      }
    }

    console.log("Sales API - Returning sale:", sale);
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase.from("penjualan").select(
      `
        *,
        member:member(nama),
        user:users(name),
        penjualan_detail(
          id_kategori,
          jumlah,
          subtotal,
          kategori:kategori(nama_kategori)
        )
      `,
      { count: "exact" }
    );

    if (startDate && endDate) {
      query = query.gte("created_at", startDate).lte("created_at", endDate);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
