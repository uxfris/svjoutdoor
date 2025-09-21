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

    // Validate payment method
    if (!["cash", "debit"].includes(paymentMethod)) {
      console.log("Sales API - Invalid payment method:", paymentMethod);
      console.log("Sales API - Payment method type:", typeof paymentMethod);
      console.log("Sales API - Payment method length:", paymentMethod?.length);
      console.log(
        "Sales API - Payment method char codes:",
        paymentMethod?.split("").map((c: string) => c.charCodeAt(0))
      );
      return NextResponse.json(
        {
          error: `Metode pembayaran tidak valid: ${paymentMethod}. Harus 'cash' atau 'debit'`,
        },
        { status: 400 }
      );
    }

    console.log("Sales API - Request body:", body);
    console.log("Sales API - Payment method:", paymentMethod);
    console.log("Sales API - Payment object:", payment);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log("Sales API - No user found");
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
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
    const saleData = {
      id_member: memberId || null,
      total_item: cart.reduce(
        (sum: number, item: any) => sum + (item.quantity || 1),
        0
      ),
      total_harga: total + discount, // Original total before discount
      diskon: discount,
      discount_type: discountType,
      bayar: payment.amount,
      diterima: payment.received,
      payment_method: paymentMethod,
      id_user: user.id,
    };

    console.log("Sales API - Sale data being inserted:", saleData);
    console.log(
      "Sales API - Payment method in sale data:",
      saleData.payment_method
    );

    const { data: sale, error: saleError } = await supabase
      .from("penjualan")
      .insert(saleData)
      .select()
      .single();

    if (saleError) {
      console.log("Sales API - Sale creation error:", saleError);
      return NextResponse.json({ error: saleError.message }, { status: 400 });
    }

    console.log("Sales API - Sale created:", sale);

    // Create sale details
    const saleDetails = cart.map((item: any) => {
      // Calculate discounted price
      const discountedPrice =
        item.discountType === "percentage"
          ? item.harga_jual - (item.harga_jual * item.discount) / 100
          : item.harga_jual - item.discount;

      return {
        id_penjualan: sale.id_penjualan,
        id_kategori: item.id_kategori,
        harga_jual: item.harga_jual,
        jumlah: item.quantity || 1, // Use quantity field, fallback to 1
        subtotal: Math.round(discountedPrice * (item.quantity || 1)), // Calculate subtotal with quantity
        diskon: item.discount,
        discount_type: item.discountType,
      };
    });

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
          quantity: item.quantity || 1, // Use quantity field, fallback to 1
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
          diskon,
          discount_type,
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
