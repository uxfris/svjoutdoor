"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AuthFormProps {
  mode: "signin" | "signup";
  error?: string;
}

export default function AuthForm({ mode, error: initialError }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || "");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ||
          (typeof window !== "undefined" ? window.location.origin : "");
        const emailRedirectTo = `${siteUrl}/auth/callback?next=/dashboard`;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: {
              name,
            },
          },
        });
        console.log("Error di sini: " + error);
        if (error) throw error;
        setError("Periksa email Anda untuk tautan konfirmasi!");
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === "signin" ? "Selamat datang kembali" : "Mulai sekarang"}
          </h2>
          <p className="text-gray-600">
            {mode === "signin"
              ? "Masuk ke akun Anda untuk melanjutkan"
              : "Buat akun Anda untuk memulai"}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div>
              <Input
                label="Nama Lengkap"
                id="name"
                name="name"
                type="text"
                required
                placeholder="Masukkan nama lengkap Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          )}

          <div>
            <Input
              label="Alamat Email"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Masukkan alamat email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div>
            <div className="relative">
              <Input
                label="Kata Sandi"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
                placeholder="Masukkan kata sandi Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base pr-12"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {mode === "signin" && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-medium text-[var(--framer-color-tint)] hover:text-[var(--framer-color-tint-hover)] transition-colors"
              >
                Lupa kata sandi?
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full h-12 text-base font-semibold"
          >
            {mode === "signin" ? "Masuk" : "Buat Akun"}
          </Button>
        </form>

        {/* <div className="mt-8 text-center">
          <p className="text-gray-600">
            {mode === "signin" ? "Belum punya akun? " : "Sudah punya akun? "}
            <a
              href={mode === "signin" ? "/signup" : "/login"}
              className="font-semibold text-[var(--framer-color-tint)] hover:text-[var(--framer-color-tint-hover)] transition-colors"
            >
              {mode === "signin" ? "Daftar" : "Masuk"}
            </a>
          </p>
        </div> */}
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
}
