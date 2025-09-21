import AuthForm from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="flex min-h-screen">
        {/* Left side - Branding and visual elements */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 to-green-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <div className="max-w-md">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white">SVJ Outdoor</h1>
              </div>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                Mulai perjalanan bisnis outdoor Anda
              </h2>
              <p className="text-xl text-white/90 leading-relaxed">
                Bergabunglah dengan ribuan pengecer outdoor yang mempercayai
                platform kami untuk mengelola inventori, memproses penjualan,
                dan mengembangkan bisnis mereka.
              </p>
              <div className="mt-12 space-y-4">
                <div className="flex items-center text-white/80">
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Easy setup in minutes</span>
                </div>
                <div className="flex items-center text-white/80">
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>24/7 customer support</span>
                </div>
                <div className="flex items-center text-white/80">
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Free trial with no credit card required</span>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-full blur-md"></div>
        </div>

        {/* Right side - Signup form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mr-3">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  SVJ Outdoor
                </h1>
              </div>
            </div>
            <AuthForm mode="signup" />
          </div>
        </div>
      </div>
    </div>
  );
}
