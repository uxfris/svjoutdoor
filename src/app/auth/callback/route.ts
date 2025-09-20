import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if this is a password recovery
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Redirect to password reset page
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
    }
  }

  // Redirect to login page if there's an error or no code
  return NextResponse.redirect(`${origin}/login`);
}
