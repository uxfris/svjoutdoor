"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formInputClass, formLabelClass } from "@/lib/form-styles";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  level: number;
  created_at: string;
  updated_at: string;
}

interface ToastMessage {
  type: "success" | "error" | "info";
  message: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Account actions state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setProfileForm({ name: userData.name });
        } else {
          showToast("error", "Gagal memuat profil");
        }
      } catch (error) {
        showToast("error", "Gagal memuat profil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const showToast = (type: ToastMessage["type"], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast("error", "Nama wajib diisi");
      return;
    }

    setProfileLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileForm.name.trim() }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        showToast("success", "Profil berhasil diperbarui");
      } else {
        const error = await response.json();
        showToast("error", error.error || "Gagal memperbarui profil");
      }
    } catch (error) {
      showToast("error", "Gagal memperbarui profil");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast("error", "Semua field password wajib diisi");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast("error", "Password baru minimal 6 karakter");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("error", "Password baru tidak cocok");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        showToast("success", "Password berhasil diubah");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const error = await response.json();
        showToast("error", error.error || "Gagal mengubah password");
      }
    } catch (error) {
      showToast("error", "Gagal mengubah password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAccountAction = async (action: string) => {
    if (action === "delete_account") {
      const confirmed = window.confirm(
        "Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan."
      );
      if (!confirmed) return;
    }

    setActionLoading(action);
    try {
      const response = await fetch("/api/profile/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        if (action === "delete_account") {
          showToast("success", "Akun berhasil dihapus");
          router.push("/login");
        } else {
          showToast("success", "Berhasil keluar dari semua perangkat");
          router.push("/login");
        }
      } else {
        const error = await response.json();
        showToast("error", error.error || "Aksi gagal");
      }
    } catch (error) {
      showToast("error", "Aksi gagal");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Profil Tidak Ditemukan
          </h1>
          <p className="text-gray-600">
            Tidak dapat memuat informasi profil Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            toast.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : toast.type === "error"
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Profil</h1>
        <p className="text-gray-600">Kelola pengaturan akun Anda</p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informasi Profil
          </h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={formLabelClass}>Nama Lengkap</label>
                <Input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  placeholder="Masukkan nama lengkap Anda"
                  required
                />
              </div>
              <div>
                <label className={formLabelClass}>Email</label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className={formLabelClass}>Peran</label>
                <Input
                  type="text"
                  value={user.level === 1 ? "Admin" : "Kasir"}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className={formLabelClass}>Bergabung Sejak</label>
                <Input
                  type="text"
                  value={new Date(user.created_at).toLocaleDateString()}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={profileLoading}
                disabled={profileLoading}
              >
                Perbarui Profil
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ubah Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={formLabelClass}>Password Saat Ini</label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Masukkan password saat ini"
                  required
                />
              </div>
              <div>
                <label className={formLabelClass}>Password Baru</label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Masukkan password baru"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className={formLabelClass}>
                  Konfirmasi Password Baru
                </label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Konfirmasi password baru"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="success"
                loading={passwordLoading}
                disabled={passwordLoading}
              >
                Ubah Password
              </Button>
            </div>
          </form>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Aksi Akun
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Keluar dari semua perangkat
                </h3>
                <p className="text-sm text-gray-500">
                  Ini akan mengeluarkan Anda dari semua perangkat kecuali yang
                  ini
                </p>
              </div>
              <Button
                variant="warning"
                onClick={() => handleAccountAction("signout_all")}
                loading={actionLoading === "signout_all"}
                disabled={actionLoading === "signout_all"}
              >
                Keluar Semua
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-red-900">Hapus Akun</h3>
                <p className="text-sm text-red-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => handleAccountAction("delete_account")}
                loading={actionLoading === "delete_account"}
                disabled={actionLoading === "delete_account"}
              >
                Hapus Akun
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
