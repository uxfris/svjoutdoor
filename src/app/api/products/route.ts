import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getCachedData,
  setCachedData,
  generateCacheKey,
  shouldCache,
  clearCache,
} from "@/lib/api-cache";

export async function GET(request: NextRequest) {
  try {
    // Check if request should be cached
    if (shouldCache(request)) {
      const cacheKey = generateCacheKey(request, "products");
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    let query = supabase.from("produk").select(
      `
        *,
        kategori:kategori(nama_kategori)
      `,
      { count: "exact" }
    );

    if (search) {
      query = query.or(`nama_produk.ilike.%${search}%,merk.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const response = {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };

    // Cache the response for 2 minutes
    if (shouldCache(request)) {
      const cacheKey = generateCacheKey(request, "products");
      setCachedData(cacheKey, response, 2 * 60 * 1000);
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("produk")
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Clear products cache when new product is added
    clearCache("products");

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
