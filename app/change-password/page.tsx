"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/validations/password";
import { apiClient } from "@/lib/api/client";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Nav from "../_components/Nav";
import Footer from "../_components/Footer";
import OnboardingSidebar from "../_components/OnboardingSidebar";

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

  useEffect(() => {
    const email = searchParams.get("email");
    const tempPassword = searchParams.get("temp");
    if (email) setValue("email", email);
    if (tempPassword) setValue("tempPassword", tempPassword);
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
      const params = new URLSearchParams({ email: data.email, password: data.newPassword });
      const storeUrl = searchParams.get("storeUrl");
      if (storeUrl) params.set("storeUrl", storeUrl);
      window.location.href = `/onboard/operating-hours?${params.toString()}`;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSubmitError(
        err.response?.data?.message ||
          "Failed to change password. Please check your credentials and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Nav />
      <section className="apply">
        <div className="container">
          <header className="apply-head">
            <div>
              <p className="section-eyebrow">Step 03 of 05</p>
              <h2 className="section-title">Set your password.</h2>
              <div className="stepbar" aria-hidden="true">
                <div className="stp done" />
                <div className="stp done" />
                <div className="stp current" />
                <div className="stp" />
                <div className="stp" />
              </div>
            </div>
            <p className="step-meta">
              One minute.<br />
              Replaces the temporary password we emailed you.
            </p>
          </header>

          {submitError && (
            <div className="alert alert-error" role="alert">
              <b>Couldn&apos;t change:</b><span>{submitError}</span>
            </div>
          )}

          <div className="apply-grid">
            <OnboardingSidebar current="password" />

            <form onSubmit={handleSubmit(onSubmit)} className="form-grid" noValidate>
              <div className="fld full">
                <label htmlFor="email">Email address</label>
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <span className="err">{errors.email.message}</span>}
              </div>

              <div className="fld full">
                <label htmlFor="tempPassword">
                  Temporary password
                  <span className="opt">from the email we sent</span>
                </label>
                <div className="pwd-wrap">
                  <input
                    {...register("tempPassword")}
                    id="tempPassword"
                    type={showTempPassword ? "text" : "password"}
                    placeholder="Paste the temporary password"
                    aria-invalid={!!errors.tempPassword}
                  />
                  <button
                    type="button"
                    className="pwd-toggle"
                    onClick={() => setShowTempPassword((v) => !v)}
                    aria-label={showTempPassword ? "Hide password" : "Show password"}
                  >
                    {showTempPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.tempPassword && <span className="err">{errors.tempPassword.message}</span>}
              </div>

              <div className="fld full">
                <label htmlFor="newPassword">
                  New password
                  <span className="opt">min 8 chars, mix of letters and a number</span>
                </label>
                <div className="pwd-wrap">
                  <input
                    {...register("newPassword")}
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Choose a secure password"
                    aria-invalid={!!errors.newPassword}
                  />
                  <button
                    type="button"
                    className="pwd-toggle"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && <span className="err">{errors.newPassword.message}</span>}
              </div>

              <div className="fld full">
                <label htmlFor="confirmPassword">Confirm new password</label>
                <div className="pwd-wrap">
                  <input
                    {...register("confirmPassword")}
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter the new password"
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    className="pwd-toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="err">{errors.confirmPassword.message}</span>}
              </div>

              <div className="form-foot">
                <span className="note"><b>Secure</b> · stored hashed, never visible to us</span>
                <button type="submit" className="btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Changing…
                    </>
                  ) : (
                    "Continue → operating hours"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="full-center"><Loader2 className="animate-spin spinner" size={32} /></div>}>
      <ChangePasswordForm />
    </Suspense>
  );
}
