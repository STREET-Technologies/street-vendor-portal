"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  operatingHoursSchema,
  defaultOperatingHours,
  type OperatingHoursFormData,
} from "@/lib/validations/operating-hours";
import { apiClient } from "@/lib/api/client";
import { Loader2, Clock, Copy, CheckCircle2 } from "lucide-react";

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
  const router = useRouter();
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

  // Auto-login with credentials from URL params
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
        const response = await apiClient.post("/auth/login", {
          email,
          password,
        });

        const token = response.data.access_token;
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
    setValue(day, {
      ...currentValue,
      isClosed: !currentValue.isClosed,
    });
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
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Redirect to success page
      router.push("/onboard/success");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSubmitError(
        err.response?.data?.message || "Failed to save operating hours. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push("/onboard/success");
  };

  if (isLoggingIn) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-street-lime mx-auto mb-4" />
          <p className="text-lg text-street-gray">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (loginError) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <Link href="/">
              <Image
                src="/img/logo-white-transparent.png"
                alt="Street London"
                width={150}
                height={50}
                priority
              />
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg mb-6">
              {loginError}
            </div>
            <p className="text-gray-400 mb-6">
              Please download the Street London Retail App to complete your setup.
            </p>
            <Link
              href="/"
              className="inline-block bg-street-lime hover:bg-street-lime/80 text-black font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Image
              src="/img/logo-white-transparent.png"
              alt="Street London"
              width={150}
              height={50}
              priority
            />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-10 h-10 text-street-lime" />
            <h1
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "Hanson Bold, sans-serif" }}
            >
              OPERATING HOURS
            </h1>
          </div>

          <p className="text-lg text-street-gray mb-2">
            Set your store&apos;s operating hours so customers know when you&apos;re available.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Don&apos;t worry - you can always update these later in the Street London Retail App.
          </p>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Copy Monday to All Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={copyMondayToAll}
                className="flex items-center gap-2 text-sm text-street-lime hover:text-street-lime/80 transition-colors"
              >
                <Copy size={16} />
                Copy Monday to all days
              </button>
            </div>

            {/* Days */}
            {DAYS.map((day) => {
              const dayErrors = errors[day];
              const isClosed = watch(`${day}.isClosed`);

              return (
                <div
                  key={day}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Day Label */}
                    <div className="sm:w-32">
                      <h3 className="font-bold text-lg">{DAY_LABELS[day]}</h3>
                    </div>

                    {/* Closed Checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`${day}-closed`}
                        checked={isClosed}
                        onChange={() => handleDayClosedToggle(day)}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-street-lime focus:ring-street-lime focus:ring-offset-black"
                      />
                      <label
                        htmlFor={`${day}-closed`}
                        className="text-sm text-gray-400 cursor-pointer"
                      >
                        Closed
                      </label>
                    </div>

                    {/* Time Inputs */}
                    {!isClosed && (
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">
                            Opens
                          </label>
                          <input
                            {...register(`${day}.openTime`)}
                            type="time"
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-street-lime"
                          />
                        </div>
                        <span className="text-gray-600 mt-5">—</span>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">
                            Closes
                          </label>
                          <input
                            {...register(`${day}.closeTime`)}
                            type="time"
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-street-lime"
                          />
                        </div>
                      </div>
                    )}

                    {/* Hidden inputs for closed days */}
                    {isClosed && (
                      <>
                        <input
                          {...register(`${day}.openTime`)}
                          type="hidden"
                          value="00:00"
                        />
                        <input
                          {...register(`${day}.closeTime`)}
                          type="hidden"
                          value="00:00"
                        />
                      </>
                    )}
                    <input
                      {...register(`${day}.isClosed`)}
                      type="hidden"
                      value={isClosed ? "true" : "false"}
                    />
                  </div>

                  {/* Error Messages */}
                  {dayErrors && (
                    <div className="mt-2 text-red-500 text-sm">
                      {dayErrors.openTime?.message ||
                        dayErrors.closeTime?.message ||
                        dayErrors.isClosed?.message}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-street-lime hover:bg-street-lime/80 text-black font-bold py-4 px-8 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2" size={20} />
                    Save & Continue
                  </>
                )}
              </button>
            </div>
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
          <p>© 2025 Street London. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function OperatingHoursPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <OperatingHoursForm />
    </Suspense>
  );
}
