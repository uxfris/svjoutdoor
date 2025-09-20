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

    if (authError) {
      console.error("Auth error in recent-sales API:", authError);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check admin status
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("level")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return NextResponse.json(
        { error: "User profile error" },
        { status: 400 }
      );
    }

    const isAdmin = userProfile?.level === 1;

    // Build query for recent sales - same approach as Sales page
    let query = supabase
      .from("penjualan")
      .select(
        `
        id_penjualan,
        total_item,
        total_harga,
        created_at,
        id_user,
        users:users!id_user(name, level)
      `
      )
      .order("created_at", { ascending: false })
      .limit(20);

    // Apply user filter for cashiers
    if (!isAdmin) {
      query = query.eq("id_user", user.id);
    }

    const { data: recentSalesData, error: salesError } = await query;

    if (salesError) {
      console.error("Error fetching recent sales:", salesError);
      return NextResponse.json({ error: salesError.message }, { status: 400 });
    }

    console.log(
      `Recent sales API: Found ${recentSalesData?.length || 0} sales for user ${
        user.id
      }, isAdmin: ${isAdmin}`
    );

    return NextResponse.json({
      data: recentSalesData || [],
      isAdmin,
      userId: user.id,
    });
  } catch (error) {
    console.error("Error in recent-sales API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
