"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  operatingHoursSchema,
  defaultOperatingHours,
  type OperatingHoursFormData,
} from "@/lib/validations/operating-hours";
import { apiClient } from "@/lib/api/client";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
import Nav from "../../_components/Nav";
import Footer from "../../_components/Footer";
import OnboardingSidebar from "../../_components/OnboardingSidebar";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<typeof DAYS[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function OperatingHoursForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OperatingHoursFormData>({
    resolver: zodResolver(operatingHoursSchema),
    defaultValues: defaultOperatingHours,
  });

  const mondayHours = watch("monday");

  useEffect(() => {
    const email = searchParams.get("email");
    const password = searchParams.get("password");

    if (!email || !password) {
      setLoginError("Missing credentials. Please log in to continue.");
      setIsLoggingIn(false);
      return;
    }

    const login = async () => {
      try {
        const response = await apiClient.post("/auth/vendor/login", { email, password });
        const token =
          response.data.data?.accessToken || response.data.access_token || response.data.accessToken;

        if (!token) {
          setLoginError("Authentication failed. No token received.");
          setIsLoggingIn(false);
          return;
        }
        setAuthToken(token);
        setIsLoggingIn(false);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        setLoginError(
          err.response?.data?.message || "Failed to authenticate. Please try logging in manually."
        );
        setIsLoggingIn(false);
      }
    };

    login();
  }, [searchParams]);

  const copyMondayToAll = () => {
    if (!mondayHours) return;
    DAYS.forEach((day) => {
      setValue(day, {
        openTime: mondayHours.openTime,
        closeTime: mondayHours.closeTime,
        isClosed: mondayHours.isClosed,
      });
    });
  };

  const handleDayClosedToggle = (day: typeof DAYS[number]) => {
    const currentValue = watch(day);
    setValue(day, { ...currentValue, isClosed: !currentValue.isClosed });
  };

  const onSubmit = async (data: OperatingHoursFormData) => {
    if (!authToken) {
      setSubmitError("Authentication required. Please refresh the page.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await apiClient.patch("/retailer/vendors/store/opening-hours", data, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      redirectToComplete();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSubmitError(err.response?.data?.message || "Failed to save operating hours. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const redirectToComplete = () => {
    const storeUrl = searchParams.get("storeUrl");
    const next = storeUrl
      ? `/onboard/complete?storeUrl=${encodeURIComponent(storeUrl)}`
      : "/onboard/complete";
    window.location.href = next;
  };

  const handleSkip = () => redirectToComplete();

  /* ── Logging in state ─────────────────────────────────── */
  if (isLoggingIn) {
    return (
      <>
        <Nav />
        <section className="apply">
          <div className="container">
            <div className="full-center">
              <Loader2 className="animate-spin spinner" size={32} />
              <p>Setting up your account…</p>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  /* ── Login error state ────────────────────────────────── */
  if (loginError) {
    return (
      <>
        <Nav />
        <section className="apply">
          <div className="container center-block">
            <div className="alert alert-error" role="alert" style={{ textAlign: "left" }}>
              <b>Authentication problem:</b><span>{loginError}</span>
            </div>
            <p className="lede" style={{ marginBottom: "1.5rem" }}>
              Please open the STREET Partner app to complete your setup.
            </p>
            <div className="cta-row">
              <Link href="/" className="btn">Go to home</Link>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  /* ── Main form ────────────────────────────────────────── */
  return (
    <>
      <Nav />
      <section className="apply">
        <div className="container">
          <header className="apply-head">
            <div>
              <p className="section-eyebrow">Step 04 of 05</p>
              <h2 className="section-title">Set your operating hours.</h2>
              <div className="stepbar" aria-hidden="true">
                <div className="stp done" />
                <div className="stp done" />
                <div className="stp done" />
                <div className="stp current" />
                <div className="stp" />
              </div>
            </div>
            <p className="step-meta">
              You can update these any time<br />
              from the STREET Partner app.
            </p>
          </header>

          {submitError && (
            <div className="alert alert-error" role="alert">
              <b>Couldn&apos;t save:</b><span>{submitError}</span>
            </div>
          )}

          <div className="apply-grid">
            <OnboardingSidebar current="hours" />

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                <button type="button" onClick={copyMondayToAll} className="copy-link">
                  <Copy size={14} />
                  Copy Monday to all days
                </button>
              </div>

              {DAYS.map((day) => {
                const dayErrors = errors[day];
                const isClosed = watch(`${day}.isClosed`);
                return (
                  <div key={day} className={`day-row ${isClosed ? "closed" : ""}`}>
                    <div className="day-name">{DAY_LABELS[day]}</div>

                    <label className="closed-check">
                      <input
                        type="checkbox"
                        checked={isClosed}
                        onChange={() => handleDayClosedToggle(day)}
                      />
                      Closed
                    </label>

                    {!isClosed ? (
                      <div className="times">
                        <div className="time-fld">
                          <label>Opens</label>
                          <input {...register(`${day}.openTime`)} type="time" />
                        </div>
                        <span className="sep">–</span>
                        <div className="time-fld">
                          <label>Closes</label>
                          <input {...register(`${day}.closeTime`)} type="time" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <input {...register(`${day}.openTime`)} type="hidden" value="00:00" />
                        <input {...register(`${day}.closeTime`)} type="hidden" value="00:00" />
                        <span />
                      </>
                    )}

                    {dayErrors && (
                      <div className="day-err">
                        {dayErrors.openTime?.message ||
                          dayErrors.closeTime?.message ||
                          dayErrors.isClosed?.message}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="form-foot" style={{ marginTop: "1.5rem" }}>
                <button type="button" onClick={handleSkip} className="btn btn-secondary">
                  Skip for now
                </button>
                <button type="submit" className="btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Save &amp; finish
                    </>
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

export default function OperatingHoursPage() {
  return (
    <Suspense
      fallback={
        <div className="full-center">
          <Loader2 className="animate-spin spinner" size={32} />
        </div>
      }
    >
      <OperatingHoursForm />
    </Suspense>
  );
}
