import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json(
      { error: "Pengguna tidak ditemukan" },
      { status: 404 }
    );
  }

  // Get user data from the users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: userData?.name || user.user_metadata?.full_name || "",
    level: userData?.level || 2,
    created_at: userData?.created_at || user.created_at,
    updated_at: userData?.updated_at || user.updated_at,
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json(
      { error: "Pengguna tidak ditemukan" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { name } = body;

  if (!name || name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Update user metadata in auth
  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { full_name: name.trim() },
  });

  if (authUpdateError) {
    return NextResponse.json(
      { error: authUpdateError.message },
      { status: 500 }
    );
  }

  // Update user data in users table
  const { data: userData, error: userUpdateError } = await supabase
    .from("users")
    .update({
      name: name.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (userUpdateError) {
    return NextResponse.json(
      { error: userUpdateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: userData.name,
    level: userData.level,
    created_at: userData.created_at,
    updated_at: userData.updated_at,
  });
}
