import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const { action } = body;

  if (!action) {
    return NextResponse.json({ error: "Action is required" }, { status: 400 });
  }

  switch (action) {
    case "signout_all":
      // Sign out from all devices by invalidating all sessions
      const { error: signOutError } = await supabase.auth.signOut({
        scope: "global",
      });

      if (signOutError) {
        return NextResponse.json(
          { error: signOutError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Signed out from all devices" });

    case "delete_account":
      // Delete user from auth and users table
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (deleteAuthError) {
        return NextResponse.json(
          { error: deleteAuthError.message },
          { status: 500 }
        );
      }

      // Delete from users table
      const { error: deleteUserError } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);

      if (deleteUserError) {
        return NextResponse.json(
          { error: deleteUserError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Account deleted successfully" });

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
