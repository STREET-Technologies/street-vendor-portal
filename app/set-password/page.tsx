"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setPasswordSchema, type SetPasswordFormData } from "@/lib/validations/password";
import { apiClient } from "@/lib/api/client";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Nav from "../_components/Nav";
import Footer from "../_components/Footer";

// Where the staff member opens the app after setting their password. Env-driven
// so staging can point at the staging PWA instead of production (TT-286).
const RETAILER_APP_URL =
  process.env.NEXT_PUBLIC_RETAILER_APP_URL || "https://retailer.street.london/";

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const email = searchParams.get("email");
  const tempPassword = searchParams.get("temp");
  const linkValid = !!email && !!tempPassword;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
  });

  const onSubmit = async (data: SetPasswordFormData) => {
    if (!email || !tempPassword) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // 1) Log in with the temp password to obtain a token. Deliberately NOT
      //    /auth/change-temp-password (that path fires the owner "store is live"
      //    onboarding email, which is wrong for staff).
      const loginRes = await apiClient.post("/auth/vendor/login", {
        email,
        password: tempPassword,
      });
      const token =
        loginRes.data.data?.accessToken ||
        loginRes.data.access_token ||
        loginRes.data.accessToken;
      if (!token) {
        setSubmitError("Could not verify your temporary password. Please use the most recent invite email.");
        return;
      }

      // 2) Set the chosen password (temp password is the current password).
      await apiClient.post(
        "/auth/change-password",
        { currentPassword: tempPassword, newPassword: data.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDone(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSubmitError(
        err.response?.data?.message ||
          "Couldn't set your password. The temporary password may be incorrect or already used."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <>
        <Nav />
        <section className="center-section">
          <div className="container center-block">
            <div className="check"><CheckCircle2 size={32} strokeWidth={2.25} /></div>
            <h1>Password set.</h1>
            <p className="lede">Open the STREET Retailer app and log in with your new password.</p>
            <div className="cta-row">
              <a
                href={RETAILER_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
              >
                Open STREET Retailer &rarr;
              </a>
            </div>
            <p className="help-line">
              Need help? <a href="mailto:support@street.london">support@street.london</a>
            </p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <section className="apply">
        <div className="container">
          <header className="apply-head">
            <div>
              <h2 className="section-title">Set your password.</h2>
            </div>
          </header>

          {!linkValid && (
            <div className="alert alert-error" role="alert">
              <b>Invalid link:</b>
              <span>This set-password link is missing details. Please use the link from your invite email.</span>
            </div>
          )}

          {submitError && (
            <div className="alert alert-error" role="alert">
              <b>Couldn&apos;t set:</b><span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="form-grid" noValidate>
            {email && (
              <div className="fld full">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" value={email} disabled readOnly />
              </div>
            )}

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
                  disabled={!linkValid}
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
                  disabled={!linkValid}
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
              <button type="submit" className="btn" disabled={isSubmitting || !linkValid}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Setting…
                  </>
                ) : (
                  "Set password"
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="full-center"><Loader2 className="animate-spin spinner" size={32} /></div>}>
      <SetPasswordForm />
    </Suspense>
  );
}
