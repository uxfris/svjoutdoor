"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import DataResetSection from "./DataResetSection";

interface Settings {
  id_setting: number;
  nama_perusahaan: string;
  alamat: string;
  telepon: string;
  path_logo: string;
  path_kartu_member: string;
  diskon: number;
  receipt_width_mm: number;
  receipt_font_size: number;
  receipt_paper_type: string;
  receipt_footer: string;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    nama_perusahaan: "",
    alamat: "",
    telepon: "",
    email: "",
    receipt_width_mm: 75,
    receipt_font_size: 12,
    receipt_paper_type: "thermal_75mm",
    receipt_footer: "",
  });

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from("setting")
        .select("*")
        .single();

      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      setSettings(settings);
      setFormData({
        nama_perusahaan: settings?.nama_perusahaan || "",
        alamat: settings?.alamat || "",
        telepon: settings?.telepon || "",
        email: "",
        receipt_width_mm: settings?.receipt_width_mm || 75,
        receipt_font_size: settings?.receipt_font_size || 12,
        receipt_paper_type: settings?.receipt_paper_type || "thermal_75mm",
        receipt_footer: settings?.receipt_footer || "",
      });

      // Check admin level
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from("users")
        .select("level")
        .eq("id", user?.id)
        .single();

      setIsAdmin(userData?.level === 1);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("_mm") || name.includes("_size")
          ? parseInt(value)
          : value,
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("setting")
        .update({
          nama_perusahaan: formData.nama_perusahaan,
          alamat: formData.alamat,
          telepon: formData.telepon,
          receipt_width_mm: formData.receipt_width_mm,
          receipt_font_size: formData.receipt_font_size,
          receipt_paper_type: formData.receipt_paper_type,
          receipt_footer: formData.receipt_footer,
          updated_at: new Date().toISOString(),
        })
        .eq("id_setting", settings?.id_setting);

      if (error) {
        console.error("Error updating settings:", error);
        alert("Failed to save settings. Please try again.");
        return;
      }

      alert("Settings saved successfully!");
      loadSettings(); // Reload settings to get updated data
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage system settings</p>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Company Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="nama_perusahaan"
                    value={formData.nama_perusahaan}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Address
                  </label>
                  <input
                    type="text"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter company address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="telepon"
                    value={formData.telepon}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Settings */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Receipt Settings
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Width
                  </label>
                  <select
                    name="receipt_width_mm"
                    value={formData.receipt_width_mm}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value={50}>50mm (2 inches) - Very Compact</option>
                    <option value={58}>
                      58mm (2.3 inches) - Small Receipt
                    </option>
                    <option value={75}>75mm (3 inches) - Standard</option>
                    <option value={80}>80mm (3.1 inches) - Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Size
                  </label>
                  <select
                    name="receipt_font_size"
                    value={formData.receipt_font_size}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value={10}>10px - Very Small</option>
                    <option value={11}>11px - Small</option>
                    <option value={12}>12px - Standard</option>
                    <option value={14}>14px - Large</option>
                    <option value={16}>16px - Very Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paper Type
                  </label>
                  <select
                    name="receipt_paper_type"
                    value={formData.receipt_paper_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="thermal_50mm">Thermal 50mm</option>
                    <option value="thermal_58mm">Thermal 58mm</option>
                    <option value="thermal_75mm">Thermal 75mm</option>
                    <option value="thermal_80mm">Thermal 80mm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Footer
                  </label>
                  <textarea
                    name="receipt_footer"
                    rows={3}
                    value={formData.receipt_footer}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter receipt footer text (e.g., Thank you for your business!)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              System Settings
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base">
                    <option value="IDR">Indonesian Rupiah (IDR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Format
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Zone
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base">
                    <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                    <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                    <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[var(--framer-color-tint)] text-white rounded-lg hover:bg-[var(--framer-color-tint-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>

        {/* Data Reset Section - Admin Only */}
        {isAdmin && <DataResetSection />}
      </div>
    </div>
  );
}
