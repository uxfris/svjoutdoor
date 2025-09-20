import DashboardLayout from "@/components/layout/DashboardLayout";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formInputClass, formLabelClass } from "@/lib/form-styles";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching user:", error);
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account settings</p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Information
            </h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={formLabelClass}>Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.user_metadata?.full_name || ""}
                    className={formInputClass}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className={formLabelClass}>Email</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-base"
                  />
                </div>
                <div>
                  <label className={formLabelClass}>Phone Number</label>
                  <input
                    type="tel"
                    defaultValue={user?.user_metadata?.phone || ""}
                    className={formInputClass}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className={formLabelClass}>Role</label>
                  <input
                    type="text"
                    value={user?.user_metadata?.role || "User"}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Update Profile
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Change Password
            </h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={formLabelClass}>Current Password</label>
                  <input
                    type="password"
                    className={formInputClass}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className={formLabelClass}>New Password</label>
                  <input
                    type="password"
                    className={formInputClass}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className={formLabelClass}>Confirm New Password</label>
                  <input
                    type="password"
                    className={formInputClass}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Change Password
                </button>
              </div>
            </form>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Account Actions
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Sign out from all devices
                  </h3>
                  <p className="text-sm text-gray-500">
                    This will sign you out from all devices except this one
                  </p>
                </div>
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  Sign Out All
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-red-900">
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-500">
                    This action cannot be undone
                  </p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
