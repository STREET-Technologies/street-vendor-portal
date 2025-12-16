"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/validations/password";
import { apiClient } from "@/lib/api/client";
import { Loader2, Eye, EyeOff } from "lucide-react";

function ChangePasswordForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Pre-fill email and temp password from URL params if provided
  useEffect(() => {
    const email = searchParams.get('email');
    const tempPassword = searchParams.get('temp');
    if (email) {
      setValue('email', email);
    }
    if (tempPassword) {
      setValue('tempPassword', tempPassword);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await apiClient.post("/auth/change-temp-password", {
        email: data.email,
        tempPassword: data.tempPassword,
        newPassword: data.newPassword,
      });

      // Redirect to operating hours setup with credentials for auto-login
      const params = new URLSearchParams({
        email: data.email,
        password: data.newPassword,
      });
      window.location.href = `/onboard/operating-hours?${params.toString()}`;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSubmitError(
        err.response?.data?.message || "Failed to change password. Please check your credentials and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Image
              src="/img/logo-white-transparent.png"
              alt="STREET"
              width={150}
              height={50}
              priority
            />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-lg mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "Hanson Bold, sans-serif" }}
          >
            SET YOUR PASSWORD
          </h1>
          <p className="text-lg text-street-gray mb-8">
            Change your temporary password to a secure password of your choice.
          </p>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-2">
                Email Address *
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Temporary Password */}
            <div>
              <label htmlFor="tempPassword" className="block text-sm font-bold mb-2">
                Temporary Password *
              </label>
              <div className="relative">
                <input
                  {...register("tempPassword")}
                  id="tempPassword"
                  type={showTempPassword ? "text" : "password"}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-street-lime"
                  placeholder="Enter temporary password from email"
                />
                <button
                  type="button"
                  onClick={() => setShowTempPassword(!showTempPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showTempPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.tempPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.tempPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-bold mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  {...register("newPassword")}
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-street-lime"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must contain at least 8 characters, including uppercase, lowercase, and a number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-street-lime"
                  placeholder="Re-enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-street-lime hover:bg-street-lime/80 text-black font-bold py-4 px-8 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Need help?{" "}
            <a
              href="mailto:support@street.london"
              className="text-street-lime hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>© 2025 STREET. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ChangePasswordForm />
    </Suspense>
  );
}
